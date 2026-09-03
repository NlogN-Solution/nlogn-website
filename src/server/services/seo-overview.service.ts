import { analyticsOverview } from "@/server/services/analytics.service";
import { searchConsoleOverview } from "@/server/services/search-console.service";
import { backlinkReport } from "@/server/services/ahrefs.service";
import { calculateHealth, type HealthScore } from "@/server/services/seo-health.service";
import { hasCompletedCrawl, issueCounts } from "@/server/services/seo-technical.service";
import { latestMobileScore } from "@/server/services/pagespeed.service";
import type { ComparedRange } from "@/lib/date-range";
import type { Delta } from "@/lib/metrics";
import type { IssueSeverity, Website } from "@/generated/prisma";

/**
 * The one call behind the dashboard's top section.
 *
 * Assembled server-side rather than by six parallel requests from the browser,
 * so a slow provider delays one panel instead of the page, and so the health
 * score is computed from the same numbers the cards display rather than from a
 * second, slightly different fetch.
 *
 * Nothing here throws. Each source reports its own connected/disconnected state
 * and the overview passes that through — a dashboard with Search Console
 * connected and nothing else must still render, with honest gaps.
 */

export type OverviewCard = {
  key: string;
  label: string;
  /** Null means "not available from a connected source" — the card explains why. */
  delta: Delta | null;
  unit: "count" | "rate" | "position" | "duration";
  source: "Google Analytics" | "Search Console" | "Ahrefs" | "NLOGN";
  /** Shown when `delta` is null. */
  unavailable?: string;
};

export type SeoOverview = {
  cards: OverviewCard[];
  health: HealthScore;
  issues: Record<IssueSeverity, number>;
  crawled: boolean;
  sources: {
    searchConsole: { connected: boolean; reason?: string; stale?: boolean; fetchedAt?: string };
    analytics: { connected: boolean; reason?: string; stale?: boolean; fetchedAt?: string };
    ahrefs: { available: boolean; reason?: string };
  };
};

export async function seoOverview(
  website: Website,
  range: ComparedRange,
  { force = false } = {},
): Promise<SeoOverview> {
  const [search, analytics, backlinks, issues, crawled, performanceScore] = await Promise.all([
    searchConsoleOverview(website, range, { force }),
    analyticsOverview(website, range, { force }),
    backlinkReport(website),
    issueCounts(website.id),
    hasCompletedCrawl(website.id),
    latestMobileScore(website.id),
  ]);

  const searchData = search.connected ? search.data : null;
  const analyticsData = analytics.connected ? analytics.data : null;

  const health = calculateHealth({
    issues,
    crawled,
    clicks: searchData?.clicks ?? null,
    position: searchData?.position ?? null,
    ctr: searchData?.ctr ?? null,
    performanceScore,
    organicUsers: analyticsData?.organicUsers ?? null,
  });

  const cards: OverviewCard[] = [
    {
      key: "organicUsers",
      label: "Organic users",
      delta: analyticsData?.organicUsers ?? null,
      unit: "count",
      source: "Google Analytics",
      ...(analytics.connected ? {} : { unavailable: analytics.reason }),
    },
    {
      key: "clicks",
      label: "Search clicks",
      delta: searchData?.clicks ?? null,
      unit: "count",
      source: "Search Console",
      ...(search.connected ? {} : { unavailable: search.reason }),
    },
    {
      key: "impressions",
      label: "Search impressions",
      delta: searchData?.impressions ?? null,
      unit: "count",
      source: "Search Console",
      ...(search.connected ? {} : { unavailable: search.reason }),
    },
    {
      key: "ctr",
      label: "Average CTR",
      delta: searchData?.ctr ?? null,
      unit: "rate",
      source: "Search Console",
      ...(search.connected ? {} : { unavailable: search.reason }),
    },
    {
      key: "position",
      label: "Average position",
      delta: searchData?.position ?? null,
      unit: "position",
      source: "Search Console",
      ...(search.connected ? {} : { unavailable: search.reason }),
    },
  ];

  // Ahrefs cards are appended only when the plan actually answers for them —
  // an empty "Backlinks —" card would imply the site has none.
  if (backlinks.available) {
    const { overview } = backlinks;

    if (overview.organicKeywords !== null) {
      cards.push({
        key: "rankingKeywords",
        label: "Ranking keywords",
        delta: flat(overview.organicKeywords),
        unit: "count",
        source: "Ahrefs",
      });
    }

    if (overview.backlinks !== null) {
      cards.push({
        key: "backlinks",
        label: "Backlinks",
        delta: flat(overview.backlinks),
        unit: "count",
        source: "Ahrefs",
      });
    }

    if (overview.referringDomains !== null) {
      cards.push({
        key: "referringDomains",
        label: "Referring domains",
        delta: flat(overview.referringDomains),
        unit: "count",
        source: "Ahrefs",
      });
    }
  }

  return {
    cards,
    health,
    issues,
    crawled,
    sources: {
      searchConsole: search.connected
        ? { connected: true, stale: search.stale, fetchedAt: search.fetchedAt }
        : { connected: false, reason: search.reason },
      analytics: analytics.connected
        ? { connected: true, stale: analytics.stale, fetchedAt: analytics.fetchedAt }
        : { connected: false, reason: analytics.reason },
      ahrefs: backlinks.available
        ? { available: true }
        : { available: false, reason: backlinks.reason },
    },
  };
}

/**
 * A current value with no comparison.
 *
 * Ahrefs reports a point-in-time figure, not a windowed one, so there is no
 * honest "previous period" to compare it against on a first read. Rendering it
 * as an unchanged delta is the truthful option — the card shows the number and
 * no trend arrow, rather than inventing a percentage.
 */
function flat(value: number): Delta {
  return {
    current: value,
    previous: value,
    change: 0,
    changePct: null,
    direction: "flat",
    sentiment: "neutral",
  };
}
