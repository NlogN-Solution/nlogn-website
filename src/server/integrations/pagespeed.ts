/**
 * Google PageSpeed Insights.
 *
 * Returns two different kinds of measurement that must never be blended:
 *
 *   Lab    One Lighthouse run in a simulated browser. Reproducible-ish, works
 *          on any URL, and noisy — a single score is not a trend.
 *   Field  28 days of real Chrome traffic (CrUX). This is what Google actually
 *          uses for Core Web Vitals, but a site without enough visitors has
 *          none at all, and that is a legitimate answer rather than a failure.
 *
 * INP and TTFB are field-only. There is no lab INP, so a low-traffic site
 * genuinely cannot report one — the UI says so instead of substituting TBT and
 * quietly relabelling it.
 *
 * Quota: 25,000 runs a day with a key, ~240 a minute. Each run takes 10–30s,
 * which is why this is only ever called from a background sync, never during a
 * page render.
 */

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type PageSpeedStrategyName = "mobile" | "desktop";

export function pageSpeedConfigured() {
  return Boolean(process.env.PAGESPEED_API_KEY);
}

export type PageSpeedResult = {
  strategy: PageSpeedStrategyName;
  url: string;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  lab: {
    lcp: number | null;
    fcp: number | null;
    cls: number | null;
    tbt: number | null;
    ttfb: number | null;
  };
  /** Null when CrUX has no data for this URL — not zero. */
  field: {
    lcp: number | null;
    inp: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
  } | null;
};

type Audit = { numericValue?: number };

type ApiResponse = {
  lighthouseResult?: {
    categories?: Record<string, { score?: number | null }>;
    audits?: Record<string, Audit>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile?: number }>;
  };
  error?: { message?: string };
};

export class PageSpeedError extends Error {}

const score = (value?: number | null) =>
  typeof value === "number" ? Math.round(value * 100) : null;

const audit = (audits: Record<string, Audit> | undefined, key: string) => {
  const value = audits?.[key]?.numericValue;
  return typeof value === "number" ? value : null;
};

export async function runPageSpeed(
  url: string,
  strategy: PageSpeedStrategyName,
): Promise<PageSpeedResult> {
  const params = new URLSearchParams({ url, strategy });
  // Requested explicitly: without them the response carries performance only,
  // and the SEO category is worth having on a dashboard like this.
  for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", category);
  }

  const key = process.env.PAGESPEED_API_KEY;
  if (key) params.set("key", key);

  const response = await fetch(`${ENDPOINT}?${params}`, {
    // A Lighthouse run is slow by nature; the default fetch timeout would give
    // up on a perfectly healthy request.
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as ApiResponse;

  if (!response.ok) {
    throw new PageSpeedError(
      data.error?.message ?? `PageSpeed Insights returned ${response.status}.`,
    );
  }

  const audits = data.lighthouseResult?.audits;
  const categories = data.lighthouseResult?.categories;
  const crux = data.loadingExperience?.metrics;

  const fieldMetric = (name: string) => {
    const percentile = crux?.[name]?.percentile;
    return typeof percentile === "number" ? percentile : null;
  };

  const hasField = Boolean(crux && Object.keys(crux).length > 0);

  return {
    strategy,
    url,
    performanceScore: score(categories?.performance?.score),
    seoScore: score(categories?.seo?.score),
    accessibilityScore: score(categories?.accessibility?.score),
    bestPracticesScore: score(categories?.["best-practices"]?.score),
    lab: {
      lcp: audit(audits, "largest-contentful-paint"),
      fcp: audit(audits, "first-contentful-paint"),
      cls: audit(audits, "cumulative-layout-shift"),
      tbt: audit(audits, "total-blocking-time"),
      ttfb: audit(audits, "server-response-time"),
    },
    field: hasField
      ? {
          lcp: fieldMetric("LARGEST_CONTENTFUL_PAINT_MS"),
          inp: fieldMetric("INTERACTION_TO_NEXT_PAINT"),
          // CrUX reports CLS multiplied by 100 so it fits an integer percentile.
          cls: (() => {
            const raw = fieldMetric("CUMULATIVE_LAYOUT_SHIFT_SCORE");
            return raw === null ? null : raw / 100;
          })(),
          fcp: fieldMetric("FIRST_CONTENTFUL_PAINT_MS"),
          ttfb: fieldMetric("EXPERIMENTAL_TIME_TO_FIRST_BYTE"),
        }
      : null,
  };
}

/** Google's own Core Web Vitals thresholds, so a rating is never our opinion. */
export const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: "ms" },
  inp: { good: 200, poor: 500, unit: "ms" },
  cls: { good: 0.1, poor: 0.25, unit: "" },
  fcp: { good: 1800, poor: 3000, unit: "ms" },
  ttfb: { good: 800, poor: 1800, unit: "ms" },
} as const;

export type VitalRating = "good" | "needs-improvement" | "poor";

export function rateVital(
  metric: keyof typeof CWV_THRESHOLDS,
  value: number | null,
): VitalRating | null {
  if (value === null) return null;
  const { good, poor } = CWV_THRESHOLDS[metric];
  if (value <= good) return "good";
  return value <= poor ? "needs-improvement" : "poor";
}
