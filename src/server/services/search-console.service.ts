import { prisma } from "@/server/db";
import { compare, type Delta } from "@/lib/metrics";
import {
  SEARCH_CONSOLE_LAG_DAYS,
  eachDay,
  type ComparedRange,
  type DateRange,
} from "@/lib/date-range";
import {
  searchByDate,
  searchCountries,
  searchDevices,
  searchPages,
  searchQueries,
  searchTotals,
  listSitemaps,
  type DimensionRow,
} from "@/server/integrations/search-console";
import { googleAccessToken } from "@/server/services/seo-connection.service";
import { TTL, cached } from "@/server/services/seo-cache.service";
import type { Website } from "@/generated/prisma";

/**
 * Search Console reporting.
 *
 * Everything goes through the cache, so opening the dashboard four times is one
 * call to Google. Everything also returns a `NotConnected` shape rather than
 * throwing when there is no credential — a disconnected integration is a normal
 * state with its own panel, not an error.
 */

export type NotConnected = { connected: false; reason: string };

export type Connected<T> = {
  connected: true;
  data: T;
  fetchedAt: string;
  stale: boolean;
  error?: string;
};

export type Reported<T> = NotConnected | Connected<T>;

const NOT_CONNECTED: NotConnected = {
  connected: false,
  reason: "Connect Google Search Console to see search rankings, clicks and impressions.",
};

const NO_PROPERTY: NotConnected = {
  connected: false,
  reason: "Choose which Search Console property this website reports on.",
};

/** Resolves the credential and property, or explains which is missing. */
async function context(website: Website) {
  if (!website.gscSiteUrl) return { ok: false as const, reason: NO_PROPERTY };

  const accessToken = await googleAccessToken(website.id);
  if (!accessToken) return { ok: false as const, reason: NOT_CONNECTED };

  return { ok: true as const, accessToken, siteUrl: website.gscSiteUrl };
}

function report<T>(payload: { data: T; fetchedAt: Date; stale: boolean; error?: string }): Connected<T> {
  return {
    connected: true,
    data: payload.data,
    fetchedAt: payload.fetchedAt.toISOString(),
    stale: payload.stale,
    ...(payload.error && { error: payload.error }),
  };
}

const rangeKey = (range: DateRange) => `${range.start}:${range.end}`;

/* ── overview ────────────────────────────────────────────────────────────── */

export type SearchOverview = {
  clicks: Delta;
  impressions: Delta;
  /** 0–1. Compared in percentage points, not relative percent. */
  ctr: Delta;
  /** Lower is better; `compare` is told so. */
  position: Delta;
  /** Daily series for the charts, gap-filled so a quiet day is a zero, not a break. */
  series: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
  /** How far behind Google's reporting is, so the UI can say it out loud. */
  lagDays: number;
};

export async function searchConsoleOverview(
  website: Website,
  range: ComparedRange,
  { force = false } = {},
): Promise<Reported<SearchOverview>> {
  const ctx = await context(website);
  if (!ctx.ok) return ctx.reason;

  const result = await cached(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    `gsc:overview:${rangeKey(range.current)}:${rangeKey(range.previous)}`,
    TTL.searchConsole,
    async () => {
      const [current, previous, daily] = await Promise.all([
        searchTotals(ctx.accessToken, ctx.siteUrl, range.current),
        searchTotals(ctx.accessToken, ctx.siteUrl, range.previous),
        searchByDate(ctx.accessToken, ctx.siteUrl, range.current),
      ]);

      // Google omits days with no data entirely. Left as-is, a chart would join
      // Monday to Thursday with a straight line and imply activity in between.
      const byDate = new Map(daily.map((point) => [point.date, point]));
      const series = eachDay(range.current).map((date) => ({
        date,
        clicks: byDate.get(date)?.clicks ?? 0,
        impressions: byDate.get(date)?.impressions ?? 0,
        ctr: byDate.get(date)?.ctr ?? 0,
        // Position is an average, not a count: a day with no impressions has no
        // position at all, and zero would drag the line to the top of the chart.
        position: byDate.get(date)?.position ?? 0,
      }));

      return { current, previous, series };
    },
    { force },
  );

  const { current, previous, series } = result.data;

  await storeDaily(website.id, series).catch(() => undefined);

  return report({
    ...result,
    data: {
      clicks: compare(current.clicks, previous.clicks),
      impressions: compare(current.impressions, previous.impressions),
      ctr: compare(current.ctr, previous.ctr),
      position: compare(current.position, previous.position, "lower-is-better"),
      series,
      lagDays: SEARCH_CONSOLE_LAG_DAYS,
    },
  });
}

/**
 * Mirrors daily totals into `SearchConsoleDaily`.
 *
 * Not a cache — this is the archive. Search Console forgets everything older
 * than 16 months, so without this the year-over-year view stops being possible
 * the moment it would first become interesting.
 */
async function storeDaily(
  websiteId: string,
  series: { date: string; clicks: number; impressions: number; ctr: number; position: number }[],
) {
  for (const point of series) {
    if (point.impressions === 0 && point.clicks === 0) continue;

    const date = new Date(`${point.date}T00:00:00.000Z`);
    const data = {
      clicks: point.clicks,
      impressions: point.impressions,
      ctr: point.ctr,
      position: point.position,
      syncedAt: new Date(),
    };

    await prisma.searchConsoleDaily
      .upsert({
        where: { websiteId_date: { websiteId, date } },
        create: { websiteId, date, ...data },
        update: data,
      })
      .catch(() => undefined);
  }
}

/* ── queries and pages ───────────────────────────────────────────────────── */

export type KeywordRow = {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  /** Derived by us from the previous window — Search Console has no such metric. */
  positionChange: number | null;
  previousPosition: number | null;
};

export async function searchConsoleQueries(
  website: Website,
  range: ComparedRange,
  { force = false } = {},
): Promise<Reported<{ rows: KeywordRow[]; truncated: boolean }>> {
  const ctx = await context(website);
  if (!ctx.ok) return ctx.reason;

  const LIMIT = 1000;

  const result = await cached(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    `gsc:queries:${rangeKey(range.current)}:${rangeKey(range.previous)}`,
    TTL.searchConsole,
    async () => {
      const [current, previous] = await Promise.all([
        searchQueries(ctx.accessToken, ctx.siteUrl, range.current, LIMIT),
        searchQueries(ctx.accessToken, ctx.siteUrl, range.previous, LIMIT),
      ]);

      const before = new Map(previous.map((row) => [row.key, row]));

      const rows: KeywordRow[] = current.map((row) => {
        const prior = before.get(row.key);
        return {
          keyword: row.key,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          // Negative means it moved up the page, because position 3 beats 8.
          positionChange: prior ? row.position - prior.position : null,
          previousPosition: prior?.position ?? null,
        };
      });

      rows.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

      return { rows, truncated: current.length >= LIMIT };
    },
    { force },
  );

  return report(result);
}

export type LandingPageRow = {
  page: string;
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  positionChange: number | null;
};

export async function searchConsolePages(
  website: Website,
  range: ComparedRange,
  { force = false } = {},
): Promise<Reported<{ rows: LandingPageRow[] }>> {
  const ctx = await context(website);
  if (!ctx.ok) return ctx.reason;

  const result = await cached(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    `gsc:pages:${rangeKey(range.current)}:${rangeKey(range.previous)}`,
    TTL.searchConsole,
    async () => {
      const [current, previous] = await Promise.all([
        searchPages(ctx.accessToken, ctx.siteUrl, range.current, 500),
        searchPages(ctx.accessToken, ctx.siteUrl, range.previous, 500),
      ]);

      const before = new Map(previous.map((row) => [row.key, row]));

      const rows: LandingPageRow[] = current.map((row) => ({
        page: row.key,
        path: safePath(row.key),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        positionChange: before.has(row.key) ? row.position - before.get(row.key)!.position : null,
      }));

      rows.sort((a, b) => b.clicks - a.clicks);

      return { rows };
    },
    { force },
  );

  return report(result);
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

/* ── breakdowns ──────────────────────────────────────────────────────────── */

export async function searchConsoleBreakdowns(
  website: Website,
  range: ComparedRange,
  { force = false } = {},
): Promise<Reported<{ countries: DimensionRow[]; devices: DimensionRow[] }>> {
  const ctx = await context(website);
  if (!ctx.ok) return ctx.reason;

  const result = await cached(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    `gsc:breakdowns:${rangeKey(range.current)}`,
    TTL.searchConsole,
    async () => {
      const [countries, devices] = await Promise.all([
        searchCountries(ctx.accessToken, ctx.siteUrl, range.current),
        searchDevices(ctx.accessToken, ctx.siteUrl, range.current),
      ]);
      return { countries, devices };
    },
    { force },
  );

  return report(result);
}

/* ── sitemaps ────────────────────────────────────────────────────────────── */

export async function searchConsoleSitemaps(website: Website) {
  const ctx = await context(website);
  if (!ctx.ok) return ctx.reason;

  const result = await cached(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    "gsc:sitemaps",
    TTL.searchConsole,
    () => listSitemaps(ctx.accessToken, ctx.siteUrl),
  );

  return report(result);
}
