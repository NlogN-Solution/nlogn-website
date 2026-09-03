import { prisma } from "@/server/db";
import { BlockedUrlError, assertPublicUrl, safeFetch } from "@/server/net-guard";
import { fetchRobots, fetchSitemapUrls } from "@/server/integrations/robots";
import type { IssueSeverity } from "@/generated/prisma";
import { ISSUE_CATALOGUE } from "@/config/seo-issues";

/**
 * The technical SEO crawl.
 *
 * Everything in §11 of the brief that no API provides — titles, meta
 * descriptions, canonical tags, alt text, broken links, page weight — has to be
 * measured by fetching the pages. So this does, under strict limits:
 *
 *  - Every request goes through `safeFetch`, which refuses private addresses
 *    and re-checks each redirect hop. See `server/net-guard.ts`.
 *  - The crawl never leaves the website's own registered domain, and that
 *    domain comes from the database, never from the request.
 *  - robots.txt is obeyed, including `Crawl-delay`.
 *  - A page budget, a wall-clock budget, and a polite delay between requests,
 *    so an audit cannot become a load test of a client's site.
 *
 * Findings are written as `SeoIssue` rows keyed on (website, code, url), so a
 * re-crawl updates `lastSeenAt` rather than duplicating, and anything not seen
 * this time is stamped resolved instead of silently disappearing.
 */

const PAGE_BUDGET = 60;
const TIME_BUDGET_MS = 4 * 60 * 1000;
/** Floor between requests, raised if robots.txt asks for more. */
const MIN_DELAY_MS = 400;
const LARGE_PAGE_BYTES = 2 * 1024 * 1024;
const SLOW_RESPONSE_MS = 1500;
const THIN_CONTENT_WORDS = 250;

type Finding = { code: string; url: string; detail?: string };

type PageFacts = {
  url: string;
  status: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  h1s: string[];
  wordCount: number;
  imagesMissingAlt: number;
  hasViewport: boolean;
  hasStructuredData: boolean;
  noindex: boolean;
  bytes: number;
  ttfb: number;
  links: string[];
  insecureAssets: number;
  redirectHops: number;
};

/* ── HTML extraction ─────────────────────────────────────────────────────── */

const stripTags = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

function metaContent(html: string, attribute: "name" | "property", value: string): string | null {
  // Attribute order varies, so both orders are tried rather than assuming one.
  const patterns = [
    new RegExp(`<meta[^>]+${attribute}=["']${value}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attribute}=["']${value}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function parsePage(url: string, html: string, status: number, bytes: number, ttfb: number, redirectHops: number): PageFacts {
  const head = html.slice(0, 200_000);

  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const canonical =
    head.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ??
    head.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1] ??
    null;

  const robotsMeta = (metaContent(head, "name", "robots") ?? "").toLowerCase();

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);

  return {
    url,
    status,
    title,
    description: metaContent(head, "name", "description"),
    canonical,
    h1s: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]).trim()),
    wordCount: stripTags(html).split(/\s+/).filter(Boolean).length,
    // An `alt=""` is a deliberate signal that an image is decorative, so only a
    // genuinely absent attribute counts as a fault.
    imagesMissingAlt: images.filter((tag) => !/\balt\s*=/i.test(tag)).length,
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(head),
    hasStructuredData:
      /<script[^>]+type=["']application\/ld\+json["']/i.test(html) ||
      /\bitemscope\b/i.test(head),
    noindex: robotsMeta.includes("noindex"),
    bytes,
    ttfb,
    redirectHops,
    links: [...html.matchAll(/<a\b[^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]),
    insecureAssets: [...html.matchAll(/\b(?:src|href)=["']http:\/\/[^"']+["']/gi)].length,
  };
}

/* ── crawl ───────────────────────────────────────────────────────────────── */

function sameSite(candidate: URL, root: URL): boolean {
  const normalise = (host: string) => host.replace(/^www\./, "").toLowerCase();
  return normalise(candidate.hostname) === normalise(root.hostname);
}

/** Fragments and query strings would multiply one page into dozens of "pages". */
function canonicalKey(url: URL): string {
  return `${url.origin}${url.pathname.replace(/\/+$/, "") || "/"}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function crawlWebsite(websiteId: string) {
  const website = await prisma.website.findUnique({ where: { id: websiteId } });
  if (!website) throw new Error("Website not found.");

  const run = await prisma.crawlRun.create({ data: { websiteId, status: "RUNNING" } });

  try {
    const result = await performCrawl(website.domain);

    await persistFindings(websiteId, result.findings);

    await prisma.crawlRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        pagesCrawled: result.pagesCrawled,
        issuesFound: result.findings.length,
        finishedAt: new Date(),
      },
    });

    return { runId: run.id, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The crawl failed.";

    await prisma.crawlRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: message.slice(0, 500), finishedAt: new Date() },
    });

    throw error;
  }
}

async function performCrawl(domain: string) {
  // The root is built from the stored domain, never from anything a request
  // supplied — this is what keeps the crawler pointed at the right site.
  const root = await assertPublicUrl(`https://${domain}`);
  const findings: Finding[] = [];

  const robots = await fetchRobots(root.origin);
  const delayMs = Math.max(MIN_DELAY_MS, (robots.crawlDelay ?? 0) * 1000);

  if (!robots.exists) findings.push({ code: "ROBOTS_MISSING", url: root.origin });

  /* Sitemap discovery: what robots.txt declares, then the conventional path. */
  let sitemapUrls: string[] = [];
  let sitemapFound = false;

  for (const candidate of [...robots.sitemaps, new URL("/sitemap.xml", root.origin).toString()]) {
    const urls = await fetchSitemapUrls(candidate).catch(() => []);
    if (urls.length > 0) {
      sitemapFound = true;
      sitemapUrls = urls;
      break;
    }
  }

  if (!sitemapFound) {
    findings.push({ code: "SITEMAP_MISSING", url: root.origin });
  } else if (robots.exists && robots.sitemaps.length === 0) {
    findings.push({ code: "SITEMAP_NOT_IN_ROBOTS", url: root.origin });
  }

  /* Frontier: the sitemap where there is one, plus the homepage, then links. */
  const queue: string[] = [root.toString()];
  const seen = new Set<string>([canonicalKey(root)]);

  for (const url of sitemapUrls) {
    try {
      const parsed = new URL(url);
      if (!sameSite(parsed, root)) continue;
      const key = canonicalKey(parsed);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(parsed.toString());
    } catch {
      // A malformed <loc> is the site's problem to fix, not a reason to stop.
    }
  }

  const pages: PageFacts[] = [];
  const startedAt = Date.now();
  // Checked with HEAD after the crawl, so a link appearing on forty pages costs
  // one request rather than forty.
  const externalLinks = new Set<string>();

  while (queue.length > 0 && pages.length < PAGE_BUDGET) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;

    const current = queue.shift()!;
    const parsed = new URL(current);

    if (!robots.isAllowed(parsed.pathname)) {
      findings.push({ code: "BLOCKED_BY_ROBOTS", url: current });
      continue;
    }

    let response;
    try {
      response = await safeFetch(current);
    } catch (error) {
      if (!(error instanceof BlockedUrlError)) {
        findings.push({ code: "SERVER_ERROR", url: current, detail: "The page could not be fetched." });
      }
      continue;
    }

    await sleep(delayMs);

    if (response.status >= 500) {
      findings.push({ code: "SERVER_ERROR", url: current, detail: `HTTP ${response.status}` });
      continue;
    }

    if (response.status === 404 || response.status === 410) {
      findings.push({ code: "NOT_FOUND", url: current });
      continue;
    }

    if (response.status !== 200) continue;

    if (!response.headers.get("content-type")?.includes("text/html")) continue;

    const facts = parsePage(
      response.url,
      response.body,
      response.status,
      response.bytes,
      response.ttfb,
      response.redirects.length,
    );
    pages.push(facts);

    /* Queue same-site links, collect external ones for a later liveness check. */
    for (const href of facts.links) {
      let link: URL;
      try {
        link = new URL(href, response.url);
      } catch {
        continue;
      }

      if (link.protocol !== "http:" && link.protocol !== "https:") continue;

      if (!sameSite(link, root)) {
        if (externalLinks.size < 40) externalLinks.add(link.toString());
        continue;
      }

      const key = canonicalKey(link);
      if (seen.has(key) || seen.size >= PAGE_BUDGET * 3) continue;
      seen.add(key);
      queue.push(link.toString());
    }
  }

  findings.push(...evaluatePages(pages));
  findings.push(...(await checkLinks([...externalLinks], delayMs)));

  return { pagesCrawled: pages.length, findings, pages };
}

/* ── evaluation ──────────────────────────────────────────────────────────── */

function evaluatePages(pages: PageFacts[]): Finding[] {
  const findings: Finding[] = [];
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();

  for (const page of pages) {
    if (page.noindex) findings.push({ code: "NOINDEX", url: page.url });

    if (page.url.startsWith("http://")) findings.push({ code: "INSECURE_URL", url: page.url });
    if (page.insecureAssets > 0) {
      findings.push({
        code: "MIXED_CONTENT",
        url: page.url,
        detail: `${page.insecureAssets} insecure reference${page.insecureAssets === 1 ? "" : "s"}`,
      });
    }

    if (!page.title) {
      findings.push({ code: "MISSING_TITLE", url: page.url });
    } else {
      if (page.title.length > 60) {
        findings.push({ code: "TITLE_TOO_LONG", url: page.url, detail: `${page.title.length} characters` });
      }
      if (page.title.length < 25) {
        findings.push({ code: "TITLE_TOO_SHORT", url: page.url, detail: page.title });
      }
      const key = page.title.toLowerCase();
      titles.set(key, [...(titles.get(key) ?? []), page.url]);
    }

    if (!page.description) {
      findings.push({ code: "MISSING_META_DESCRIPTION", url: page.url });
    } else {
      const key = page.description.toLowerCase();
      descriptions.set(key, [...(descriptions.get(key) ?? []), page.url]);
    }

    if (!page.canonical) {
      findings.push({ code: "MISSING_CANONICAL", url: page.url });
    } else {
      try {
        const canonical = new URL(page.canonical, page.url);
        if (canonicalKey(canonical) !== canonicalKey(new URL(page.url))) {
          findings.push({ code: "CANONICAL_MISMATCH", url: page.url, detail: `Points at ${canonical.toString()}` });
        }
      } catch {
        findings.push({ code: "CANONICAL_MISMATCH", url: page.url, detail: "The canonical tag is not a valid URL." });
      }
    }

    if (page.h1s.length === 0) findings.push({ code: "MISSING_H1", url: page.url });
    if (page.h1s.length > 1) {
      findings.push({ code: "MULTIPLE_H1", url: page.url, detail: `${page.h1s.length} main headings` });
    }

    if (page.wordCount < THIN_CONTENT_WORDS) {
      findings.push({ code: "THIN_CONTENT", url: page.url, detail: `${page.wordCount} words` });
    }

    if (page.imagesMissingAlt > 0) {
      findings.push({
        code: "MISSING_ALT_TEXT",
        url: page.url,
        detail: `${page.imagesMissingAlt} image${page.imagesMissingAlt === 1 ? "" : "s"}`,
      });
    }

    if (!page.hasViewport) findings.push({ code: "MISSING_VIEWPORT", url: page.url });
    if (!page.hasStructuredData) findings.push({ code: "MISSING_STRUCTURED_DATA", url: page.url });

    if (page.bytes > LARGE_PAGE_BYTES) {
      findings.push({
        code: "LARGE_PAGE",
        url: page.url,
        detail: `${(page.bytes / 1024 / 1024).toFixed(1)} MB`,
      });
    }

    if (page.ttfb > SLOW_RESPONSE_MS) {
      findings.push({ code: "SLOW_RESPONSE", url: page.url, detail: `${Math.round(page.ttfb)} ms` });
    }

    if (page.redirectHops > 1) {
      findings.push({ code: "REDIRECT_CHAIN", url: page.url, detail: `${page.redirectHops} redirects` });
    }
  }

  for (const [, urls] of titles) {
    if (urls.length > 1) {
      for (const url of urls) {
        findings.push({ code: "DUPLICATE_TITLE", url, detail: `Shared with ${urls.length - 1} other page${urls.length === 2 ? "" : "s"}` });
      }
    }
  }

  for (const [, urls] of descriptions) {
    if (urls.length > 1) {
      for (const url of urls) {
        findings.push({ code: "DUPLICATE_META_DESCRIPTION", url, detail: `Shared with ${urls.length - 1} other page${urls.length === 2 ? "" : "s"}` });
      }
    }
  }

  return findings;
}

/** HEAD requests, so a dead-link check does not download forty pages. */
async function checkLinks(urls: string[], delayMs: number): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const url of urls) {
    try {
      const response = await safeFetch(url, { method: "HEAD" });
      if (response.status === 404 || response.status === 410 || response.status >= 500) {
        findings.push({ code: "BROKEN_LINK", url, detail: `HTTP ${response.status}` });
      }
    } catch {
      // A refused or unresolvable external host is usually a firewall or a
      // site that rejects HEAD, not a broken link. Reporting it would fill the
      // dashboard with findings nobody can act on.
    }
    await sleep(delayMs);
  }

  return findings;
}

/* ── persistence ─────────────────────────────────────────────────────────── */

async function persistFindings(websiteId: string, findings: Finding[]) {
  const seenAt = new Date();

  // Deduplicated on (code, url): a page with three untitled images produces one
  // finding carrying a count, not three rows.
  const unique = new Map<string, Finding>();
  for (const finding of findings) {
    if (!ISSUE_CATALOGUE[finding.code]) continue;
    unique.set(`${finding.code}|${finding.url}`, finding);
  }

  for (const finding of unique.values()) {
    const severity = ISSUE_CATALOGUE[finding.code].severity as IssueSeverity;

    await prisma.seoIssue
      .upsert({
        where: {
          websiteId_code_url: { websiteId, code: finding.code, url: finding.url },
        },
        create: {
          websiteId,
          code: finding.code,
          url: finding.url,
          severity,
          detail: finding.detail,
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
        },
        // `resolvedAt: null` matters — an issue that came back must reopen
        // rather than stay filed as fixed.
        update: { lastSeenAt: seenAt, detail: finding.detail, severity, resolvedAt: null },
      })
      .catch((error) => console.error("[crawler] could not save finding:", error));
  }

  // Anything the crawl did not see this time has been fixed or removed. Marked
  // resolved rather than deleted, so the history of what was wrong survives.
  await prisma.seoIssue
    .updateMany({
      where: { websiteId, resolvedAt: null, lastSeenAt: { lt: seenAt } },
      data: { resolvedAt: seenAt },
    })
    .catch(() => undefined);
}
