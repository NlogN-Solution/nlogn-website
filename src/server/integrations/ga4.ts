import type { DateRange } from "@/lib/date-range";

/**
 * Google Analytics 4 — the **Data API**, for reporting.
 *
 * This has nothing to do with the gtag.js snippet in
 * `components/site/analytics.tsx`. That tag *collects* data and is identified
 * by a measurement ID (`G-2H6500B256`); this reads data back and needs the
 * numeric **property** ID. They are different identifiers for different jobs,
 * and confusing them is the usual reason a dashboard like this returns nothing.
 *
 * Limits worth knowing, because they shape what the UI can promise:
 *  - Property-level quota is spent per report, and complex reports cost more.
 *  - High-cardinality dimensions collapse into `(other)` once a property's row
 *    limit is hit; those rows are real but unattributable.
 *  - Demographic and geographic rows are thresholded — a low-traffic property
 *    legitimately returns nothing, which is not the same as zero.
 */

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";

export class AnalyticsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AnalyticsError";
    this.status = status;
  }
}

async function call<T>(accessToken: string, url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    throw new AnalyticsError(
      detail?.error?.message ?? `Analytics returned ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/* ── properties ──────────────────────────────────────────────────────────── */

export type Ga4Property = {
  /** Bare numeric id, without the `properties/` prefix. */
  propertyId: string;
  displayName: string;
  account: string;
};

/**
 * Every GA4 property this account can read, so the admin picks from a list
 * rather than hunting for a number in the Google Analytics interface.
 */
export async function listProperties(accessToken: string): Promise<Ga4Property[]> {
  const summaries = await call<{
    accountSummaries?: {
      displayName?: string;
      propertySummaries?: { property?: string; displayName?: string }[];
    }[];
  }>(accessToken, `${ADMIN_API}/accountSummaries?pageSize=200`);

  return (summaries.accountSummaries ?? []).flatMap((account) =>
    (account.propertySummaries ?? []).map((property) => ({
      propertyId: property.property?.replace("properties/", "") ?? "",
      displayName: property.displayName ?? "Untitled property",
      account: account.displayName ?? "",
    })),
  ).filter((property) => property.propertyId);
}

/* ── reports ─────────────────────────────────────────────────────────────── */

type ReportResponse = {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
  totals?: { metricValues?: { value?: string }[] }[];
  metricHeaders?: { name?: string }[];
};

function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<ReportResponse> {
  return call<ReportResponse>(
    accessToken,
    `${DATA_API}/properties/${encodeURIComponent(propertyId)}:runReport`,
    body,
  );
}

const num = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type AnalyticsTotals = {
  users: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  /** 0–1, as GA4 reports it. */
  engagementRate: number;
  /** Seconds per active user. */
  avgEngagementTime: number;
  screenPageViews: number;
  /** Null when the property has no key events configured — not zero. */
  conversions: number | null;
};

const TOTAL_METRICS = [
  "totalUsers",
  "newUsers",
  "sessions",
  "engagedSessions",
  "engagementRate",
  "userEngagementDuration",
  "screenPageViews",
  "keyEvents",
] as const;

export async function analyticsTotals(
  accessToken: string,
  propertyId: string,
  range: DateRange,
): Promise<AnalyticsTotals> {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: TOTAL_METRICS.map((name) => ({ name })),
  });

  const values = report.totals?.[0]?.metricValues ?? report.rows?.[0]?.metricValues ?? [];
  const at = (index: number) => num(values[index]?.value);

  const users = at(0);
  const engagementDuration = at(5);

  return {
    users,
    newUsers: at(1),
    sessions: at(2),
    engagedSessions: at(3),
    engagementRate: at(4),
    // GA4 returns total engaged seconds; the per-user average is the figure
    // anybody actually reads. Guarded, because a zero-user window divides badly.
    avgEngagementTime: users > 0 ? engagementDuration / users : 0,
    screenPageViews: at(6),
    // A property with no key events set up returns the metric as 0. Reporting
    // "0 conversions" would imply conversions are being tracked and failing,
    // so an absent header is reported as null and the card is hidden.
    conversions: report.metricHeaders?.some((h) => h.name === "keyEvents") ? at(7) : null,
  };
}

export type DailyAnalyticsPoint = {
  date: string;
  users: number;
  newUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: number;
};

export async function analyticsByDate(
  accessToken: string,
  propertyId: string,
  range: DateRange,
): Promise<DailyAnalyticsPoint[]> {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: 400,
  });

  return (report.rows ?? []).map((row) => {
    const raw = row.dimensionValues?.[0]?.value ?? "";
    return {
      // GA4 returns `YYYYMMDD`; everything else in this codebase uses ISO.
      date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
      users: num(row.metricValues?.[0]?.value),
      newUsers: num(row.metricValues?.[1]?.value),
      sessions: num(row.metricValues?.[2]?.value),
      screenPageViews: num(row.metricValues?.[3]?.value),
      engagementRate: num(row.metricValues?.[4]?.value),
    };
  });
}

export type ChannelRow = { channel: string; users: number; sessions: number };

/**
 * Traffic by default channel group — Organic Search, Direct, Referral and the
 * rest. This is GA4's own classification rather than one we infer from source.
 */
export async function analyticsByChannel(
  accessToken: string,
  propertyId: string,
  range: DateRange,
): Promise<ChannelRow[]> {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "totalUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
    limit: 25,
  });

  return (report.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "Unassigned",
    users: num(row.metricValues?.[0]?.value),
    sessions: num(row.metricValues?.[1]?.value),
  }));
}

export type PageRow = { path: string; title: string; views: number; users: number };

export async function analyticsTopPages(
  accessToken: string,
  propertyId: string,
  range: DateRange,
  limit = 25,
): Promise<PageRow[]> {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (report.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    title: row.dimensionValues?.[1]?.value ?? "",
    views: num(row.metricValues?.[0]?.value),
    users: num(row.metricValues?.[1]?.value),
  }));
}

export async function analyticsLandingPages(
  accessToken: string,
  propertyId: string,
  range: DateRange,
  limit = 25,
): Promise<PageRow[]> {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit,
  });

  return (report.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    title: "",
    views: num(row.metricValues?.[0]?.value),
    users: num(row.metricValues?.[1]?.value),
  }));
}

export type BreakdownRow = { key: string; users: number; sessions: number };

async function breakdown(
  accessToken: string,
  propertyId: string,
  range: DateRange,
  dimension: string,
  limit: number,
): Promise<BreakdownRow[]> {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: dimension }],
    metrics: [{ name: "totalUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
    limit,
  });

  return (report.rows ?? []).map((row) => ({
    key: row.dimensionValues?.[0]?.value ?? "",
    users: num(row.metricValues?.[0]?.value),
    sessions: num(row.metricValues?.[1]?.value),
  }));
}

export const analyticsByDevice = (t: string, p: string, r: DateRange) =>
  breakdown(t, p, r, "deviceCategory", 10);

/**
 * Geography. Returns an empty array on a low-traffic property because Google
 * withholds thresholded rows — the UI must read that as "not enough data",
 * never as "no visitors from anywhere".
 */
export const analyticsByCountry = (t: string, p: string, r: DateRange, limit = 15) =>
  breakdown(t, p, r, "country", limit);
