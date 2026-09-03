import { safeFetch } from "@/server/net-guard";

/**
 * robots.txt parsing.
 *
 * Our crawler obeys it. Not because it is legally obliged to on a site the
 * operator owns, but because a tool that ignores robots.txt on one domain is a
 * tool that will ignore it on the wrong domain eventually — and because
 * "blocked by robots.txt" is itself one of the findings this audit reports, so
 * the rules have to be read either way.
 *
 * Deliberately a subset of the specification: `User-agent`, `Allow`,
 * `Disallow`, `Crawl-delay` and `Sitemap`. Longest-match-wins with Allow
 * beating Disallow on equal length, which is Google's documented behaviour.
 */

export type RobotsRules = {
  exists: boolean;
  /** Sitemaps declared in the file, absolute. */
  sitemaps: string[];
  /** Seconds the file asks crawlers to wait, if any. */
  crawlDelay: number | null;
  isAllowed: (path: string) => boolean;
};

const ALLOW_ALL: RobotsRules = {
  exists: false,
  sitemaps: [],
  crawlDelay: null,
  isAllowed: () => true,
};

type Rule = { path: string; allow: boolean };

export async function fetchRobots(origin: string, userAgent = "nlogn-seo-audit"): Promise<RobotsRules> {
  try {
    const response = await safeFetch(new URL("/robots.txt", origin).toString());
    // A 404 means no rules, which means everything is permitted. Anything else
    // unexpected is treated the same way rather than blocking the whole audit.
    if (response.status !== 200) return ALLOW_ALL;
    return parseRobots(response.body, userAgent);
  } catch {
    return ALLOW_ALL;
  }
}

/** Split out from fetching so the rule resolution can be tested without a network. */
export function parseRobots(body: string, userAgent = "nlogn-seo-audit"): RobotsRules {
  const sitemaps: string[] = [];
  const groups = new Map<string, Rule[]>();
  const delays = new Map<string, number>();

  let active: string[] = [];
  // Consecutive User-agent lines share one group; a directive ends the header.
  let inHeader = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === "user-agent") {
      if (!inHeader) active = [];
      active.push(value.toLowerCase());
      inHeader = true;
      if (!groups.has(value.toLowerCase())) groups.set(value.toLowerCase(), []);
      continue;
    }

    inHeader = false;
    if (active.length === 0) continue;

    if (field === "allow" || field === "disallow") {
      for (const agent of active) {
        groups.get(agent)?.push({ path: value, allow: field === "allow" });
      }
      continue;
    }

    if (field === "crawl-delay") {
      const seconds = Number(value);
      if (Number.isFinite(seconds)) {
        for (const agent of active) delays.set(agent, seconds);
      }
    }
  }

  // A group naming us specifically wins outright; otherwise the wildcard applies.
  const agent = userAgent.toLowerCase();
  const key = [...groups.keys()].find((name) => agent.includes(name) && name !== "*") ?? "*";
  const rules = groups.get(key) ?? [];

  return {
    exists: true,
    sitemaps,
    crawlDelay: delays.get(key) ?? delays.get("*") ?? null,
    isAllowed: (path: string) => {
      let best: Rule | null = null;

      for (const rule of rules) {
        if (!matches(path, rule.path)) continue;
        if (
          !best ||
          rule.path.length > best.path.length ||
          // Equal specificity: Allow wins, per Google's resolution rules.
          (rule.path.length === best.path.length && rule.allow)
        ) {
          best = rule;
        }
      }

      // An empty Disallow value means "nothing is disallowed".
      if (best && best.path === "") return true;
      return best ? best.allow : true;
    },
  };
}

/** Supports the `*` and `$` wildcards every major crawler honours. */
function matches(path: string, pattern: string): boolean {
  if (pattern === "") return true;
  if (!pattern.includes("*") && !pattern.endsWith("$")) return path.startsWith(pattern);

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\\\$$/, "$");

  try {
    return new RegExp(`^${escaped}`).test(path);
  } catch {
    return false;
  }
}

/**
 * URLs from a sitemap, following one level of sitemap-index nesting.
 *
 * Regex rather than an XML parser: this reads two tag names out of a document
 * we then treat as a list of strings to validate, and adding an XML dependency
 * for that is not a trade worth making.
 */
export async function fetchSitemapUrls(sitemapUrl: string, limit = 500): Promise<string[]> {
  const urls: string[] = [];

  const read = async (url: string): Promise<string[]> => {
    try {
      const response = await safeFetch(url);
      if (response.status !== 200) return [];
      return [...response.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    } catch {
      return [];
    }
  };

  const top = await read(sitemapUrl);
  const isIndex = /\.xml$/i.test(sitemapUrl) && top.some((url) => /\.xml(\?|$)/i.test(url));

  if (isIndex) {
    // Cap the fan-out: a sitemap index can legitimately list fifty children,
    // and this audit does not need all of them to find patterns.
    for (const child of top.slice(0, 5)) {
      urls.push(...(await read(child)));
      if (urls.length >= limit) break;
    }
  } else {
    urls.push(...top);
  }

  return [...new Set(urls)].slice(0, limit);
}
