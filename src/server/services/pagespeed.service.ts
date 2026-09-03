import { prisma } from "@/server/db";
import { pageSpeedConfigured, rateVital, runPageSpeed, type VitalRating } from "@/server/integrations/pagespeed";
import type { PageSpeedStrategy, Website } from "@/generated/prisma";

/**
 * Core Web Vitals and PageSpeed.
 *
 * Kept firmly separate from search visibility and from traffic, as the brief
 * asks: a fast site is not a well-ranked site, and averaging the two into one
 * "score" would tell nobody anything useful.
 *
 * Runs are stored rather than fetched on demand. A Lighthouse run takes ten to
 * thirty seconds — far too slow for a page render — and one run is noisy
 * enough that the trend across stored runs is the honest reading.
 */

export type VitalReading = {
  value: number | null;
  rating: VitalRating | null;
};

export type PageSpeedReport = {
  strategy: "mobile" | "desktop";
  url: string;
  fetchedAt: string;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  lab: { lcp: VitalReading; fcp: VitalReading; cls: VitalReading; tbt: VitalReading; ttfb: VitalReading };
  /**
   * Real-visitor data from Chrome. Null when the site has too little traffic
   * for Google to report it — which is common, and is not a fault.
   */
  field: { lcp: VitalReading; inp: VitalReading; cls: VitalReading; fcp: VitalReading; ttfb: VitalReading } | null;
};

export type PerformanceReport =
  | { available: false; reason: string }
  | {
      available: true;
      mobile: PageSpeedReport | null;
      desktop: PageSpeedReport | null;
      history: { date: string; mobile: number | null; desktop: number | null }[];
      /** True when neither strategy has field data, so the UI can explain once. */
      fieldDataMissing: boolean;
    };

const NOT_CONFIGURED =
  "PageSpeed Insights is not configured. Add a PAGESPEED_API_KEY to the server environment to measure page speed and Core Web Vitals.";

const NEVER_RUN =
  "No page speed measurement has been taken yet. Run a sync to measure this site.";

const reading = (value: number | null, metric: Parameters<typeof rateVital>[0]): VitalReading => ({
  value,
  rating: rateVital(metric, value),
});

/** Runs both strategies and stores the results. Called by the sync job only. */
export async function measurePageSpeed(website: Website) {
  if (!pageSpeedConfigured()) return { measured: 0 };

  const url = `https://${website.domain}`;
  let measured = 0;

  // Sequential: two Lighthouse runs in parallel is a good way to trip the
  // per-minute quota for no gain, since neither is on a critical path.
  for (const strategy of ["mobile", "desktop"] as const) {
    try {
      const result = await runPageSpeed(url, strategy);

      await prisma.pageSpeedSnapshot.create({
        data: {
          websiteId: website.id,
          url,
          strategy: strategy.toUpperCase() as PageSpeedStrategy,
          performanceScore: result.performanceScore,
          seoScore: result.seoScore,
          accessibilityScore: result.accessibilityScore,
          bestPracticesScore: result.bestPracticesScore,
          lcpLab: result.lab.lcp,
          fcpLab: result.lab.fcp,
          clsLab: result.lab.cls,
          tbtLab: result.lab.tbt,
          ttfbLab: result.lab.ttfb,
          lcpField: result.field?.lcp ?? null,
          inpField: result.field?.inp ?? null,
          clsField: result.field?.cls ?? null,
          fcpField: result.field?.fcp ?? null,
          ttfbField: result.field?.ttfb ?? null,
          hasFieldData: result.field !== null,
        },
      });

      measured += 1;
    } catch (error) {
      console.error(`[pagespeed] ${strategy} run failed:`, error);
    }
  }

  return { measured };
}

export async function performanceReport(website: Website): Promise<PerformanceReport> {
  const [mobile, desktop, history] = await Promise.all([
    latest(website.id, "MOBILE"),
    latest(website.id, "DESKTOP"),
    scoreHistory(website.id),
  ]);

  if (!mobile && !desktop) {
    return { available: false, reason: pageSpeedConfigured() ? NEVER_RUN : NOT_CONFIGURED };
  }

  return {
    available: true,
    mobile,
    desktop,
    history,
    fieldDataMissing: !mobile?.field && !desktop?.field,
  };
}

async function latest(websiteId: string, strategy: PageSpeedStrategy): Promise<PageSpeedReport | null> {
  const row = await prisma.pageSpeedSnapshot.findFirst({
    where: { websiteId, strategy },
    orderBy: { fetchedAt: "desc" },
  });

  if (!row) return null;

  return {
    strategy: strategy.toLowerCase() as "mobile" | "desktop",
    url: row.url,
    fetchedAt: row.fetchedAt.toISOString(),
    performanceScore: row.performanceScore,
    seoScore: row.seoScore,
    accessibilityScore: row.accessibilityScore,
    bestPracticesScore: row.bestPracticesScore,
    lab: {
      lcp: reading(row.lcpLab, "lcp"),
      fcp: reading(row.fcpLab, "fcp"),
      cls: reading(row.clsLab, "cls"),
      // TBT has no Core Web Vitals threshold of its own — it is a lab proxy for
      // responsiveness, not a vital. Reported without a rating rather than
      // scored against INP's thresholds, which would be a different metric.
      tbt: { value: row.tbtLab, rating: null },
      ttfb: reading(row.ttfbLab, "ttfb"),
    },
    field: row.hasFieldData
      ? {
          lcp: reading(row.lcpField, "lcp"),
          inp: reading(row.inpField, "inp"),
          cls: reading(row.clsField, "cls"),
          fcp: reading(row.fcpField, "fcp"),
          ttfb: reading(row.ttfbField, "ttfb"),
        }
      : null,
  };
}

/** One point per day per strategy, for the trend line. */
async function scoreHistory(websiteId: string) {
  const rows = await prisma.pageSpeedSnapshot.findMany({
    where: { websiteId, fetchedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    orderBy: { fetchedAt: "asc" },
    select: { fetchedAt: true, strategy: true, performanceScore: true },
  });

  const byDate = new Map<string, { mobile: number | null; desktop: number | null }>();

  for (const row of rows) {
    const date = row.fetchedAt.toISOString().slice(0, 10);
    const entry = byDate.get(date) ?? { mobile: null, desktop: null };
    if (row.strategy === "MOBILE") entry.mobile = row.performanceScore;
    else entry.desktop = row.performanceScore;
    byDate.set(date, entry);
  }

  return [...byDate.entries()].map(([date, scores]) => ({ date, ...scores }));
}

/** Mobile performance score, for the health calculation. Null when never run. */
export async function latestMobileScore(websiteId: string): Promise<number | null> {
  const row = await prisma.pageSpeedSnapshot.findFirst({
    where: { websiteId, strategy: "MOBILE" },
    orderBy: { fetchedAt: "desc" },
    select: { performanceScore: true },
  });

  return row?.performanceScore ?? null;
}
