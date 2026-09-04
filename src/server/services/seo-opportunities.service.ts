import type { KeywordRow, LandingPageRow } from "@/server/services/search-console.service";

/**
 * SEO opportunities, derived from Search Console data.
 *
 * Every figure quoted here is one Google actually reported — clicks,
 * impressions, CTR, position. The *judgement* about which of them is an
 * opportunity is ours, and each opportunity says so in `basis`, so nobody reads
 * "close to page one" as something Google declared.
 *
 * One deliberate choice underpins the CTR checks. The obvious approach is an
 * industry "expected CTR by position" table, but those numbers vary wildly by
 * query intent and none of them describes this particular site. So the
 * benchmark here is **the site's own median CTR at comparable positions**. It
 * needs no external source, adapts to the brand, and cannot quietly become
 * fiction when someone else's table goes out of date.
 */

export type OpportunityKind =
  | "close-to-page-one"
  | "high-impressions-low-ctr"
  | "high-ctr-low-position"
  | "declining";

export type Opportunity = {
  kind: OpportunityKind;
  keyword: string;
  /** The page it applies to, when the opportunity is page-level. */
  page?: string;
  headline: string;
  recommendation: string;
  /** Says which numbers are Google's and which reasoning is ours. */
  basis: string;
  metrics: {
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
    positionChange?: number | null;
    /** The site's own median CTR at this position band, where one could be computed. */
    benchmarkCtr?: number;
  };
  /** Ordering weight. Impressions at stake, roughly. */
  score: number;
};

/* Bands wide enough that each holds enough keywords for a median to mean something. */
const POSITION_BANDS = [
  { min: 1, max: 3 },
  { min: 3, max: 6 },
  { min: 6, max: 11 },
  { min: 11, max: 21 },
  { min: 21, max: 51 },
  { min: 51, max: 101 },
];

/** Below this many keywords a band's median is noise, so no benchmark is offered. */
const MIN_BAND_SIZE = 5;

function bandFor(position: number) {
  return POSITION_BANDS.find((band) => position >= band.min && position < band.max);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Median CTR per position band, computed from this site's own keywords. */
function ctrBenchmarks(rows: KeywordRow[]): Map<string, number> {
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    // Keywords with almost no impressions produce wild CTRs — one click on
    // three impressions is 33% — and would poison the median.
    if (row.impressions < 20) continue;

    const band = bandFor(row.position);
    if (!band) continue;

    const key = `${band.min}`;
    buckets.set(key, [...(buckets.get(key) ?? []), row.ctr]);
  }

  const benchmarks = new Map<string, number>();
  for (const [key, values] of buckets) {
    if (values.length >= MIN_BAND_SIZE) benchmarks.set(key, median(values));
  }

  return benchmarks;
}

export function findOpportunities(
  keywords: KeywordRow[],
  pages: LandingPageRow[] = [],
): { opportunities: Opportunity[]; benchmarkAvailable: boolean } {
  const benchmarks = ctrBenchmarks(keywords);
<<<<<<< Updated upstream
=======
  const pageByPath = new Map(pages.map((page) => [page.page, page]));
>>>>>>> Stashed changes
  const found: Opportunity[] = [];

  const benchmarkFor = (position: number) => {
    const band = bandFor(position);
    return band ? benchmarks.get(`${band.min}`) : undefined;
  };

  for (const row of keywords) {
    const benchmark = benchmarkFor(row.position);

    /* ── close to page one ──────────────────────────────────────────────── */

    // Positions 11–20 are the second page: already ranking, already earning
    // impressions, and a small improvement moves them somewhere people look.
    if (row.position > 10 && row.position <= 20 && row.impressions >= 100) {
      found.push({
        kind: "close-to-page-one",
        keyword: row.keyword,
        headline: `"${row.keyword}" is just off the first page`,
        recommendation:
          "This search already shows your site, but on page two where almost nobody looks. Strengthening the page that ranks for it — more depth on the topic, a clearer title, a few internal links pointing at it — is usually enough to move a keyword this close.",
        basis:
          "Position and impressions are reported by Google Search Console. Which keywords count as 'close' is our own threshold: positions 11–20 with at least 100 impressions.",
        metrics: {
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          positionChange: row.positionChange,
        },
        // Impressions at stake, weighted by how close to page one it already is.
        score: row.impressions * (21 - row.position),
      });
      continue;
    }

    /* ── high impressions, low CTR ──────────────────────────────────────── */

    // Ranking well but not being clicked is a listing problem, not a ranking
    // problem — which makes it one of the cheapest things on the list to fix.
    if (
      benchmark !== undefined &&
      row.position <= 10 &&
      row.impressions >= 500 &&
      row.ctr < benchmark * 0.6
    ) {
      found.push({
        kind: "high-impressions-low-ctr",
        keyword: row.keyword,
        headline: `"${row.keyword}" is seen often but rarely clicked`,
        recommendation:
          "Your page appears high in the results for this search, yet fewer people click it than click your other results in the same positions. That usually means the title and description do not match what the searcher wanted. Rewriting them to answer the search directly is the fix.",
        basis: `Clicks, impressions, CTR and position come from Search Console. The comparison is against this site's own median CTR at positions ${bandFor(row.position)?.min}–${(bandFor(row.position)?.max ?? 1) - 1} (${(benchmark * 100).toFixed(2)}%), calculated by us — not an industry benchmark.`,
        metrics: {
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          benchmarkCtr: benchmark,
        },
        // Clicks forgone if it merely performed averagely.
        score: (benchmark - row.ctr) * row.impressions * 100,
      });
      continue;
    }

    /* ── strong CTR, weak position ──────────────────────────────────────── */

    // People choose this result when they see it, and they rarely see it. That
    // is a ranking worth pushing, because the demand is already demonstrated.
    if (
      benchmark !== undefined &&
      row.position > 10 &&
      row.impressions >= 200 &&
      row.ctr > benchmark * 1.5
    ) {
      found.push({
        kind: "high-ctr-low-position",
        keyword: row.keyword,
        headline: `"${row.keyword}" gets clicked well despite ranking low`,
        recommendation:
          "People pick your result for this search more often than they pick your results at similar positions elsewhere — the listing is clearly appealing, it is just not being shown high enough. This is a strong candidate for focused work, because the interest is already proven.",
        basis:
          "All four metrics are from Search Console. 'Well above average' is measured against this site's own median CTR at the same position band, computed by us.",
        metrics: {
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          benchmarkCtr: benchmark,
        },
        score: row.clicks * 50,
      });
      continue;
    }

    /* ── declining ─────────────────────────────────────────────────────── */

    // A positive change means the number went up, and a bigger position number
    // is a worse position — so this is a fall in visibility.
    if (
      row.positionChange !== null &&
      row.positionChange > 3 &&
      row.impressions >= 100 &&
      row.previousPosition !== null
    ) {
      found.push({
        kind: "declining",
        keyword: row.keyword,
        headline: `"${row.keyword}" has slipped down the results`,
        recommendation:
          "This search used to show your site higher than it does now. It is worth checking whether the page has aged, whether a competitor has published something more thorough, or whether the page changed recently.",
        basis:
          "Positions for both periods are from Search Console. Search Console does not publish a position-change metric — this movement is calculated by us by comparing the two windows.",
        metrics: {
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          positionChange: row.positionChange,
        },
        score: row.impressions * row.positionChange,
      });
    }
  }

  /* Page-level: a page with real impressions and no clicks at all. */
  for (const page of pages) {
    if (page.impressions >= 1000 && page.clicks === 0) {
      found.push({
        kind: "high-impressions-low-ctr",
        keyword: page.path,
        page: page.page,
        headline: `${page.path} is shown in search but never clicked`,
        recommendation:
          "This page appears in Google's results regularly and has received no clicks at all in this period. Check how its title and description read in the results — if they do not describe what the page offers, nobody has a reason to choose it.",
        basis: "Clicks, impressions and position are reported by Search Console for this page.",
        metrics: {
          position: page.position,
          impressions: page.impressions,
          clicks: 0,
          ctr: 0,
        },
        score: page.impressions * 2,
      });
    }
  }

  found.sort((a, b) => b.score - a.score);

  // Capped: a list of two hundred "opportunities" is a list nobody reads.
  return {
    opportunities: found.slice(0, 40),
    benchmarkAvailable: benchmarks.size > 0,
  };
}

export const OPPORTUNITY_LABELS: Record<OpportunityKind, { title: string; blurb: string }> = {
  "close-to-page-one": {
    title: "Close to page one",
    blurb: "Already ranking on page two. A small improvement could move these onto the first page.",
  },
  "high-impressions-low-ctr": {
    title: "Seen but not clicked",
    blurb: "Ranking well, yet people are choosing someone else's result. Usually a title and description fix.",
  },
  "high-ctr-low-position": {
    title: "Popular but ranking low",
    blurb: "People click these when they see them. Getting them higher should pay off quickly.",
  },
  declining: {
    title: "Losing ground",
    blurb: "These searches showed your site higher last period than they do now.",
  },
};

/** Used by the page-level cards. */
export function isPageOpportunity(kind: OpportunityKind, page?: string) {
  return Boolean(page) && kind === "high-impressions-low-ctr";
}

export type { KeywordRow, LandingPageRow };
