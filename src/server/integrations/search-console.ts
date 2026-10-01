import type { DateRange } from "@/lib/date-range";

/**
 * Google Search Console — Search Analytics, Sitemaps and URL Inspection.
 *
 * Plain REST over `fetch`. Every function takes an access token rather than a
 * website id, so this module holds no credentials and cannot leak one.
 *
 * What this API genuinely provides is narrower than people expect, and the
 * dashboard must not imply otherwise:
 *
 *  - Data is finalised 2–3 days late. There is no "today".
 *  - History stops at 16 months. Longer charts come from our own snapshots.
 *  - There is **no position-change metric**. Any such column is computed by us
 *    from two windows and is labelled as derived.
 *  - Query rows are anonymised and sampled: summing per-query clicks will not
 *    equal the site total. That gap is Google's, not a bug to be corrected.
 */

const SEARCH_CONSOLE_API = "https://searchconsole.googleapis.com/webmasters/v3";
const INSPECTION_API = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

/** The API's hard ceiling per request. */
const MAX_ROWS = 25_000;

export class SearchConsoleError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SearchConsoleError";
    this.status = status;
  }
}

async function call<T>(
  accessToken: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${SEARCH_CONSOLE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    throw new SearchConsoleError(
      detail?.error?.message ?? `Search Console returned ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/* ── properties ──────────────────────────────────────────────────────────── */

export type SearchConsoleSite = {
  siteUrl: string;
  permissionLevel: string;
};

/**
 * Every property this Google account can read. `siteUnverifiedUser` is filtered
 * out — the account can see it listed but every data call would 403, which is a
 * confusing thing to offer in a dropdown.
 */
export async function listSites(accessToken: string): Promise<SearchConsoleSite[]> {
  const data = await call<{ siteEntry?: SearchConsoleSite[] }>(accessToken, "/sites");

  return (data.siteEntry ?? [])
    .filter((site) => site.permissionLevel !== "siteUnverifiedUser")
    .sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

/* ── search analytics ────────────────────────────────────────────────────── */

export type SearchRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchTotals = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type QueryOptions = {
  dimensions?: ("date" | "query" | "page" | "country" | "device")[];
  rowLimit?: number;
  startRow?: number;
  type?: "web" | "image" | "video" | "news" | "discover" | "googleNews";
};

export async function searchAnalytics(
  accessToken: string,
  siteUrl: string,
  range: DateRange,
  options: QueryOptions = {},
): Promise<SearchRow[]> {
  const data = await call<{ rows?: SearchRow[] }>(
    accessToken,
    `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      body: {
        startDate: range.start,
        endDate: range.end,
        dimensions: options.dimensions ?? [],
        rowLimit: Math.min(options.rowLimit ?? 1000, MAX_ROWS),
        startRow: options.startRow ?? 0,
        type: options.type ?? "web",
        // `dataState: "final"` excludes the incomplete most-recent days rather
        // than letting them drag a trend line down for a day and then silently
        // correct themselves.
        dataState: "final",
      },
    },
  );

  return data.rows ?? [];
}

/**
 * Site-wide totals for a window.
 *
 * Requested with no dimensions, which is the only way to get Google's true
 * totals — summing a dimensioned response undercounts, because rows below the
 * anonymity threshold are withheld.
 */
export async function searchTotals(
  accessToken: string,
  siteUrl: string,
  range: DateRange,
): Promise<SearchTotals> {
  const rows = await searchAnalytics(accessToken, siteUrl, range, { rowLimit: 1 });
  const row = rows[0];

  if (!row) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  return {
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  };
}

export type DailyPoint = SearchTotals & { date: string };

export async function searchByDate(
  accessToken: string,
  siteUrl: string,
  range: DateRange,
): Promise<DailyPoint[]> {
  const rows = await searchAnalytics(accessToken, siteUrl, range, {
    dimensions: ["date"],
    // One row per day; 550 covers the longest range the UI offers with room over.
    rowLimit: 550,
  });

  return rows
    .map((row) => ({
      date: row.keys[0],
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type DimensionRow = SearchTotals & { key: string };

async function byDimension(
  accessToken: string,
  siteUrl: string,
  range: DateRange,
  dimension: "query" | "page" | "country" | "device",
  limit: number,
): Promise<DimensionRow[]> {
  const rows = await searchAnalytics(accessToken, siteUrl, range, {
    dimensions: [dimension],
    rowLimit: limit,
  });

  return rows.map((row) => ({
    key: row.keys[0],
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

export const searchQueries = (t: string, s: string, r: DateRange, limit = 1000) =>
  byDimension(t, s, r, "query", limit);

export const searchPages = (t: string, s: string, r: DateRange, limit = 1000) =>
  byDimension(t, s, r, "page", limit);

export const searchCountries = (t: string, s: string, r: DateRange, limit = 50) =>
  byDimension(t, s, r, "country", limit);

export const searchDevices = (t: string, s: string, r: DateRange) =>
  byDimension(t, s, r, "device", 10);

/* ── sitemaps ────────────────────────────────────────────────────────────── */

export type SitemapEntry = {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  errors?: string;
  warnings?: string;
  contents?: { type: string; submitted: string; indexed?: string }[];
};

export async function listSitemaps(
  accessToken: string,
  siteUrl: string,
): Promise<SitemapEntry[]> {
  const data = await call<{ sitemap?: SitemapEntry[] }>(
    accessToken,
    `/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
  );
  return data.sitemap ?? [];
}

/* ── URL inspection ──────────────────────────────────────────────────────── */

export type InspectionResult = {
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime?: string;
  canonicalUrl?: string;
  googleCanonical?: string;
  mobileVerdict?: string;
  richResultsVerdict?: string;
};

/**
 * Ground truth on whether Google has actually indexed one URL.
 *
 * Quota is 2,000 URLs a day and 600 a minute per property, so this is used for
 * spot checks on the pages that matter — never as a crawler. `inspectUrls`
 * below enforces a ceiling rather than trusting callers to remember.
 */
export async function inspectUrl(
  accessToken: string,
  siteUrl: string,
  inspectionUrl: string,
): Promise<InspectionResult | null> {
  const response = await fetch(INSPECTION_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "en-GB" }),
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    inspectionResult?: {
      indexStatusResult?: Record<string, string>;
      mobileUsabilityResult?: { verdict?: string };
      richResultsResult?: { verdict?: string };
    };
  };

  const index = data.inspectionResult?.indexStatusResult;
  if (!index) return null;

  return {
    verdict: index.verdict ?? "VERDICT_UNSPECIFIED",
    coverageState: index.coverageState ?? "Unknown",
    robotsTxtState: index.robotsTxtState ?? "Unknown",
    indexingState: index.indexingState ?? "Unknown",
    lastCrawlTime: index.lastCrawlTime,
    canonicalUrl: index.userCanonical,
    googleCanonical: index.googleCanonical,
    mobileVerdict: data.inspectionResult?.mobileUsabilityResult?.verdict,
    richResultsVerdict: data.inspectionResult?.richResultsResult?.verdict,
  };
}

/** Hard ceiling per run, well inside the 2,000/day and 600/min quotas. */
export const INSPECTION_BUDGET = 25;

export async function inspectUrls(
  accessToken: string,
  siteUrl: string,
  urls: string[],
): Promise<Map<string, InspectionResult>> {
  const results = new Map<string, InspectionResult>();

  // Sequential on purpose: the per-minute quota is the binding constraint, and
  // twenty-five parallel requests is the fastest way to start getting 429s.
  for (const url of urls.slice(0, INSPECTION_BUDGET)) {
    const result = await inspectUrl(accessToken, siteUrl, url).catch(() => null);
    if (result) results.set(url, result);
  }

  return results;
}
