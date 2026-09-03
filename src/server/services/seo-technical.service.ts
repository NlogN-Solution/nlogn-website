import { prisma } from "@/server/db";
import { ISSUE_CATALOGUE, SEVERITY_ORDER } from "@/config/seo-issues";
import type { IssueSeverity } from "@/generated/prisma";

/**
 * Technical SEO findings, grouped for reading.
 *
 * The crawler writes one row per (issue, URL). Nobody wants to read four
 * hundred rows, so this groups them by issue type and attaches the catalogue's
 * client-facing explanation — what happened, why it matters, what to do — to
 * each group. Individual URLs stay available underneath, because the person who
 * has to fix it does need the list.
 */

export type TechnicalIssueGroup = {
  code: string;
  title: string;
  severity: IssueSeverity;
  count: number;
  what: string;
  why: string;
  fix: string;
  /** Capped for the response; `count` is the real total. */
  urls: { url: string; detail: string | null; firstSeenAt: string }[];
};

export type TechnicalReport = {
  /** Null until a crawl has completed — distinct from "crawled and found nothing". */
  lastCrawl: {
    startedAt: string;
    finishedAt: string | null;
    status: string;
    pagesCrawled: number;
    error: string | null;
  } | null;
  counts: Record<IssueSeverity, number>;
  groups: TechnicalIssueGroup[];
  /** Issues that were present and are now gone, most recent first. */
  recentlyResolved: { code: string; title: string; url: string; resolvedAt: string }[];
};

const URLS_PER_GROUP = 50;

export async function technicalReport(websiteId: string): Promise<TechnicalReport> {
  const [lastRun, issues, resolved] = await Promise.all([
    prisma.crawlRun.findFirst({ where: { websiteId }, orderBy: { startedAt: "desc" } }),
    prisma.seoIssue.findMany({
      where: { websiteId, resolvedAt: null },
      orderBy: [{ severity: "asc" }, { lastSeenAt: "desc" }],
    }),
    prisma.seoIssue.findMany({
      where: { websiteId, resolvedAt: { not: null } },
      orderBy: { resolvedAt: "desc" },
      take: 10,
    }),
  ]);

  const counts: Record<IssueSeverity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const grouped = new Map<string, typeof issues>();

  for (const issue of issues) {
    counts[issue.severity] += 1;
    grouped.set(issue.code, [...(grouped.get(issue.code) ?? []), issue]);
  }

  const groups: TechnicalIssueGroup[] = [];

  for (const [code, rows] of grouped) {
    const definition = ISSUE_CATALOGUE[code];
    // A row whose code is no longer in the catalogue is skipped rather than
    // rendered with a raw code — the whole point is that clients never see one.
    if (!definition) continue;

    groups.push({
      code,
      title: definition.title,
      severity: definition.severity,
      count: rows.length,
      what: definition.what(rows.length),
      why: definition.why,
      fix: definition.fix,
      urls: rows.slice(0, URLS_PER_GROUP).map((row) => ({
        url: row.url,
        detail: row.detail,
        firstSeenAt: row.firstSeenAt.toISOString(),
      })),
    });
  }

  // Severity first, then the biggest problems within each severity.
  groups.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      b.count - a.count,
  );

  return {
    lastCrawl: lastRun
      ? {
          startedAt: lastRun.startedAt.toISOString(),
          finishedAt: lastRun.finishedAt?.toISOString() ?? null,
          status: lastRun.status,
          pagesCrawled: lastRun.pagesCrawled,
          error: lastRun.error,
        }
      : null,
    counts,
    groups,
    recentlyResolved: resolved
      .filter((row) => ISSUE_CATALOGUE[row.code])
      .map((row) => ({
        code: row.code,
        title: ISSUE_CATALOGUE[row.code].title,
        url: row.url,
        resolvedAt: row.resolvedAt!.toISOString(),
      })),
  };
}

/** Just the counts, for the overview cards and the health score. */
export async function issueCounts(websiteId: string) {
  const rows = await prisma.seoIssue.groupBy({
    by: ["severity"],
    where: { websiteId, resolvedAt: null },
    _count: true,
  });

  const counts: Record<IssueSeverity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const row of rows) counts[row.severity] = row._count;

  return counts;
}

export async function hasCompletedCrawl(websiteId: string) {
  const run = await prisma.crawlRun.findFirst({
    where: { websiteId, status: "COMPLETED" },
    select: { id: true },
  });
  return Boolean(run);
}
