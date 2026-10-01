import { prisma } from "@/server/db";
import { buildRange, SEARCH_CONSOLE_LAG_DAYS, ANALYTICS_LAG_DAYS } from "@/lib/date-range";
import { analyticsOverview } from "@/server/services/analytics.service";
import { searchConsoleOverview, searchConsoleQueries, searchConsolePages } from "@/server/services/search-console.service";
import { measurePageSpeed, type MeasureStrategy } from "@/server/services/pagespeed.service";
import { ahrefsCapabilities, backlinkReport } from "@/server/services/ahrefs.service";
import { crawlWebsite } from "@/server/services/crawler.service";
import { invalidate } from "@/server/services/seo-cache.service";
import { markStatus, markSynced } from "@/server/services/seo-connection.service";
import { ahrefsConfigured } from "@/server/integrations/ahrefs";
import type { SeoProvider, Website } from "@/generated/prisma";

/**
 * Background synchronisation.
 *
 * The dashboard reads from the database and the report cache; this is what puts
 * data there. Running it on a schedule rather than on page load is what keeps
 * the app inside every provider's quota, keeps a slow Lighthouse run off the
 * request path, and means an outage at Google shows yesterday's figures with a
 * timestamp instead of an error.
 *
 * A failing provider never stops the others: each is caught, recorded on its
 * own connection row, and reported in the result.
 */

export type SyncResult = {
  provider: SeoProvider | "CRAWLER";
  ok: boolean;
  detail: string;
};

/** The 28-day window is what the sync warms; other ranges fetch on first view. */
function syncRange(lagDays: number) {
  return buildRange("28d", { lagDays });
}

export async function syncSearchConsole(website: Website): Promise<SyncResult> {
  if (!website.gscSiteUrl) {
    return { provider: "GOOGLE_SEARCH_CONSOLE", ok: false, detail: "No Search Console property is selected." };
  }

  try {
    const range = syncRange(SEARCH_CONSOLE_LAG_DAYS);

    const overview = await searchConsoleOverview(website, range, { force: true });
    if (!overview.connected) {
      await markStatus(website.id, "GOOGLE_SEARCH_CONSOLE", "NEEDS_REAUTH", overview.reason);
      return { provider: "GOOGLE_SEARCH_CONSOLE", ok: false, detail: overview.reason };
    }

    // Warmed here so the keyword and page tables are instant on first open.
    await Promise.all([
      searchConsoleQueries(website, range, { force: true }),
      searchConsolePages(website, range, { force: true }),
    ]);

    await markSynced(website.id, "GOOGLE_SEARCH_CONSOLE");

    return {
      provider: "GOOGLE_SEARCH_CONSOLE",
      ok: true,
      detail: `${overview.data.clicks.current} clicks over the last 28 days.`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Search Console sync failed.";
    await markStatus(website.id, "GOOGLE_SEARCH_CONSOLE", "ERROR", detail);
    return { provider: "GOOGLE_SEARCH_CONSOLE", ok: false, detail };
  }
}

export async function syncAnalytics(website: Website): Promise<SyncResult> {
  if (!website.ga4PropertyId) {
    return { provider: "GOOGLE_ANALYTICS", ok: false, detail: "No Analytics property is selected." };
  }

  try {
    const overview = await analyticsOverview(website, syncRange(ANALYTICS_LAG_DAYS), { force: true });

    if (!overview.connected) {
      await markStatus(website.id, "GOOGLE_ANALYTICS", "NEEDS_REAUTH", overview.reason);
      return { provider: "GOOGLE_ANALYTICS", ok: false, detail: overview.reason };
    }

    await markSynced(website.id, "GOOGLE_ANALYTICS");

    return {
      provider: "GOOGLE_ANALYTICS",
      ok: true,
      detail: `${overview.data.users.current} users over the last 28 days.`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Analytics sync failed.";
    await markStatus(website.id, "GOOGLE_ANALYTICS", "ERROR", detail);
    return { provider: "GOOGLE_ANALYTICS", ok: false, detail };
  }
}

/**
 * `strategies` defaults to the single most overdue one — see `measurePageSpeed`.
 * A Lighthouse run is 20-30s, so measuring both is only safe where the whole
 * time budget is available, which on this route it is not.
 */
export async function syncPageSpeed(
  website: Website,
  { strategies }: { strategies?: readonly MeasureStrategy[] } = {},
): Promise<SyncResult> {
  try {
    const { measured, ran } = await measurePageSpeed(website, { strategies });

    if (measured === 0) {
      return {
        provider: "PAGESPEED",
        ok: false,
        detail: "PageSpeed Insights is not configured, or the run failed.",
      };
    }

    await markSynced(website.id, "PAGESPEED").catch(() => undefined);
    return { provider: "PAGESPEED", ok: true, detail: `Measured ${ran.join(" and ")}.` };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "PageSpeed sync failed.";
    return { provider: "PAGESPEED", ok: false, detail };
  }
}

export async function syncAhrefs(website: Website): Promise<SyncResult> {
  if (!ahrefsConfigured()) {
    return {
      provider: "AHREFS",
      ok: false,
      detail: "No Ahrefs API token is configured. Ahrefs Webmaster Tools has no API.",
    };
  }

  try {
    const capabilities = await ahrefsCapabilities(website, { refresh: true });

    if (!capabilities.available) {
      return { provider: "AHREFS", ok: false, detail: capabilities.reason ?? "Unavailable on this plan." };
    }

    await backlinkReport(website, { force: true });
    await markSynced(website.id, "AHREFS");

    return { provider: "AHREFS", ok: true, detail: `${capabilities.endpoints.length} reports available.` };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Ahrefs sync failed.";
    await markStatus(website.id, "AHREFS", "ERROR", detail);
    return { provider: "AHREFS", ok: false, detail };
  }
}

export async function syncCrawl(website: Website): Promise<SyncResult> {
  try {
    const result = await crawlWebsite(website.id);
    return {
      provider: "CRAWLER",
      ok: true,
      detail: `${result.pagesCrawled} pages checked, ${result.findings.length} findings.`,
    };
  } catch (error) {
    return {
      provider: "CRAWLER",
      ok: false,
      detail: error instanceof Error ? error.message : "The crawl failed.",
    };
  }
}

/**
 * Every provider for one website.
 *
 * Sequential rather than parallel: the crawl and the Lighthouse runs are the
 * slow parts and both make outbound requests to the same site, so running them
 * alongside each other would have this tool hammering a client's server.
 *
 * That sequencing is also why the two slow steps are optional. Search Console
 * and Analytics are a handful of API calls; a crawl and two Lighthouse runs are
 * a minute between them, and a request that exceeds `maxDuration` is killed
 * before any provider can record that it succeeded — which is what leaves a
 * provider showing as never connected despite having synced fine.
 *
 *   pageSpeed: "one"   the most overdue strategy (default; ~25s)
 *              "both"  mobile and desktop (~50s — scheduled runs only)
 *              "skip"  leave it to its own sync
 */
export async function syncWebsite(
  website: Website,
  {
    includeCrawl = true,
    pageSpeed = "one",
  }: { includeCrawl?: boolean; pageSpeed?: "one" | "both" | "skip" } = {},
): Promise<SyncResult[]> {
  await invalidate(website.id);

  const results: SyncResult[] = [
    await syncSearchConsole(website),
    await syncAnalytics(website),
    await syncAhrefs(website),
  ];

  if (pageSpeed !== "skip") {
    results.push(
      await syncPageSpeed(website, {
        strategies: pageSpeed === "both" ? (["mobile", "desktop"] as const) : undefined,
      }),
    );
  }

  if (includeCrawl) results.push(await syncCrawl(website));

  return results;
}

/** The scheduled entry point. Active websites only. */
export async function syncAllWebsites({
  includeCrawl = true,
  pageSpeed = "one",
}: { includeCrawl?: boolean; pageSpeed?: "one" | "both" | "skip" } = {}) {
  const websites = await prisma.website.findMany({ where: { isActive: true } });
  const report: { website: string; results: SyncResult[] }[] = [];

  for (const website of websites) {
    report.push({
      website: website.domain,
      results: await syncWebsite(website, { includeCrawl, pageSpeed }),
    });
  }

  return report;
}

export async function syncProvider(website: Website, provider: SeoProvider | "CRAWLER") {
  await invalidate(website.id, provider === "CRAWLER" ? undefined : provider);

  switch (provider) {
    case "GOOGLE_SEARCH_CONSOLE":
      return syncSearchConsole(website);
    case "GOOGLE_ANALYTICS":
      return syncAnalytics(website);
    case "PAGESPEED":
      return syncPageSpeed(website);
    case "AHREFS":
      return syncAhrefs(website);
    case "CRAWLER":
      return syncCrawl(website);
  }
}
