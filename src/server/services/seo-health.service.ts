import type { IssueSeverity } from "@/generated/prisma";
import type { Delta } from "@/lib/metrics";

/**
 * The NLOGN SEO Health Score.
 *
 * This is **our** score. Google publishes no such number and neither does
 * Ahrefs, so it is named after us everywhere it appears, and every component is
 * returned alongside the total so anybody can see exactly what produced it.
 *
 * Two rules keep it honest:
 *
 *  1. A component with no data is **excluded**, not scored as zero. A site with
 *     no PageSpeed data yet is not an unhealthy site, and quietly counting a
 *     missing input as a failure is how these scores become meaningless.
 *  2. The total is the weighted average of whatever *was* measured, and the
 *     response says how many components that was. A score built from two of
 *     five inputs is reported as such rather than presented as a full verdict.
 */

export type HealthComponent = {
  key: string;
  label: string;
  /** 0–100 for this component alone. */
  score: number;
  weight: number;
  /** Plain-language reason for the score, shown in the breakdown. */
  detail: string;
};

export type HealthScore = {
  /** 0–100, or null when nothing at all could be measured. */
  score: number | null;
  grade: "Excellent" | "Good" | "Needs work" | "Poor" | "Not enough data";
  components: HealthComponent[];
  /** How many of the five possible inputs were available. */
  measured: number;
  possible: number;
  /** Shown next to the number, always. */
  disclaimer: string;
};

export const HEALTH_DISCLAIMER =
  "The NLOGN SEO Health Score is calculated by us from the data on this dashboard. It is not a Google or Ahrefs score and no such official score exists. The breakdown below shows exactly what went into it.";

/** Severity weights: a critical issue outweighs a pile of low-priority ones. */
const SEVERITY_PENALTY: Record<IssueSeverity, number> = {
  CRITICAL: 25,
  HIGH: 8,
  MEDIUM: 2.5,
  LOW: 0.5,
};

const POSSIBLE_COMPONENTS = 5;

export type HealthInputs = {
  issues: Record<IssueSeverity, number> | null;
  /** Whether a crawl has ever completed. Zero issues before any crawl is not a pass. */
  crawled: boolean;
  clicks: Delta | null;
  position: Delta | null;
  ctr: Delta | null;
  /** 0–100 Lighthouse performance score, mobile. */
  performanceScore: number | null;
  organicUsers: Delta | null;
};

export function calculateHealth(inputs: HealthInputs): HealthScore {
  const components: HealthComponent[] = [];

  /* ── technical health (35) ──────────────────────────────────────────────── */

  if (inputs.crawled && inputs.issues) {
    const penalty =
      inputs.issues.CRITICAL * SEVERITY_PENALTY.CRITICAL +
      inputs.issues.HIGH * SEVERITY_PENALTY.HIGH +
      inputs.issues.MEDIUM * SEVERITY_PENALTY.MEDIUM +
      inputs.issues.LOW * SEVERITY_PENALTY.LOW;

    const total =
      inputs.issues.CRITICAL + inputs.issues.HIGH + inputs.issues.MEDIUM + inputs.issues.LOW;

    components.push({
      key: "technical",
      label: "Technical health",
      score: Math.max(0, 100 - penalty),
      weight: 35,
      detail:
        total === 0
          ? "No technical issues were found in the last crawl."
          : `${inputs.issues.CRITICAL} critical, ${inputs.issues.HIGH} high, ${inputs.issues.MEDIUM} medium and ${inputs.issues.LOW} low-priority issues found.`,
    });
  }

  /* ── search visibility trend (25) ───────────────────────────────────────── */

  if (inputs.clicks && inputs.position) {
    // Centred on 50 so a flat site scores neutrally rather than badly. Growth
    // and rank improvements push it up; decline pushes it down.
    const clickTrend = clamp(50 + (inputs.clicks.changePct ?? 0) * 1.5, 0, 100);
    // Negative change means the position number fell, which is an improvement.
    const positionTrend = clamp(50 - inputs.position.change * 6, 0, 100);

    components.push({
      key: "visibility",
      label: "Search visibility trend",
      score: (clickTrend + positionTrend) / 2,
      weight: 25,
      detail: `Clicks ${describe(inputs.clicks.direction)} and average position ${inputs.position.change <= 0 ? "improved" : "slipped"} against the previous period.`,
    });
  }

  /* ── click-through rate (15) ────────────────────────────────────────────── */

  if (inputs.ctr) {
    // 5% is a strong site-wide CTR; the scale is linear up to that and capped.
    components.push({
      key: "ctr",
      label: "Click-through rate",
      score: clamp((inputs.ctr.current / 0.05) * 100, 0, 100),
      weight: 15,
      detail: `${(inputs.ctr.current * 100).toFixed(2)}% of people who see your site in search results click through.`,
    });
  }

  /* ── page speed (15) ────────────────────────────────────────────────────── */

  if (inputs.performanceScore !== null) {
    components.push({
      key: "performance",
      label: "Page speed",
      score: inputs.performanceScore,
      weight: 15,
      detail: `Google's mobile performance score for your homepage is ${inputs.performanceScore} out of 100.`,
    });
  }

  /* ── organic traffic trend (10) ─────────────────────────────────────────── */

  if (inputs.organicUsers) {
    components.push({
      key: "organic",
      label: "Organic traffic trend",
      score: clamp(50 + (inputs.organicUsers.changePct ?? 0) * 1.5, 0, 100),
      weight: 10,
      detail: `Visitors arriving from search ${describe(inputs.organicUsers.direction)} compared with the previous period.`,
    });
  }

  if (components.length === 0) {
    return {
      score: null,
      grade: "Not enough data",
      components: [],
      measured: 0,
      possible: POSSIBLE_COMPONENTS,
      disclaimer: HEALTH_DISCLAIMER,
    };
  }

  // Re-weighted across what was actually measured, so the total is always out
  // of 100 rather than silently capped by the missing components' weights.
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  const score = Math.round(
    components.reduce((sum, component) => sum + component.score * component.weight, 0) / totalWeight,
  );

  return {
    score,
    grade: grade(score),
    components,
    measured: components.length,
    possible: POSSIBLE_COMPONENTS,
    disclaimer: HEALTH_DISCLAIMER,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function describe(direction: Delta["direction"]) {
  return direction === "up" ? "grew" : direction === "down" ? "fell" : "held steady";
}

function grade(score: number): HealthScore["grade"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Poor";
}
