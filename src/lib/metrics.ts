/**
 * Metric comparison and formatting.
 *
 * Client-safe, and shared by the API and the cards so a number is never
 * formatted two different ways on the same screen.
 *
 * The subtlety worth stating plainly is direction versus sentiment. They are
 * not the same thing, and conflating them is how a dashboard ends up painting
 * an improvement red:
 *
 *   Clicks up            → direction up,   sentiment positive
 *   Average position up  → direction up,   sentiment **negative**
 *
 * Google's average position is a rank: 1 is the top of page one, so a rising
 * number means falling visibility. Every metric therefore declares its own
 * polarity and `compare()` applies it, rather than each card deciding for
 * itself and one of them eventually getting it wrong.
 */

export type Polarity = "higher-is-better" | "lower-is-better";

export type Delta = {
  current: number;
  previous: number;
  /** Absolute difference, current minus previous. */
  change: number;
  /** Percentage change, or null when the previous period was zero. */
  changePct: number | null;
  direction: "up" | "down" | "flat";
  sentiment: "positive" | "negative" | "neutral";
};

/** Below this, a change is noise and is reported as flat. */
const FLAT_THRESHOLD = 0.0001;

export function compare(
  current: number,
  previous: number,
  polarity: Polarity = "higher-is-better",
): Delta {
  const change = current - previous;
  const direction = Math.abs(change) < FLAT_THRESHOLD ? "flat" : change > 0 ? "up" : "down";

  const improved = polarity === "higher-is-better" ? change > 0 : change < 0;

  return {
    current,
    previous,
    change,
    // Growth from zero is not "infinite percent" — it is a new number, and the
    // card shows the absolute value instead.
    changePct: previous === 0 ? null : (change / Math.abs(previous)) * 100,
    direction,
    sentiment: direction === "flat" ? "neutral" : improved ? "positive" : "negative",
  };
}

/* ── formatting ──────────────────────────────────────────────────────────── */

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(value);
}

export function formatCompact(value: number): string {
  if (Math.abs(value) < 10_000) return formatNumber(value);
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Takes a 0–1 rate, as both Search Console and GA4 report it. */
export function formatPercent(rate: number, digits = 2): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

export function formatPosition(value: number): string {
  return value.toFixed(1);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

/**
 * The comparison line under a metric — "↑ 23.4% vs previous period".
 *
 * Percentages are wrong for two of these. A CTR moving from 3.0% to 3.4% is a
 * 13% relative change, which nobody means; the useful statement is "+0.4
 * percentage points". Average position is the same: "2.1 positions" is what an
 * SEO reads, not "14% better".
 */
export function formatDelta(
  delta: Delta,
  unit: "count" | "rate" | "position" | "duration" = "count",
): string {
  if (delta.direction === "flat") return "No change";

  const arrow = delta.direction === "up" ? "↑" : "↓";
  const magnitude = Math.abs(delta.change);

  if (unit === "rate") {
    return `${arrow} ${(magnitude * 100).toFixed(2)} percentage points`;
  }

  if (unit === "position") {
    return `${arrow} ${magnitude.toFixed(1)} position${magnitude === 1 ? "" : "s"}`;
  }

  if (delta.changePct === null) {
    return `${arrow} ${unit === "duration" ? formatDuration(magnitude) : formatNumber(magnitude)}`;
  }

  return `${arrow} ${Math.abs(delta.changePct).toFixed(1)}%`;
}

/** "Last updated 6 hours ago", for the stale-data notice. */
export function relativeTime(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((Date.now() - then.getTime()) / 1000);

  if (seconds < 90) return "just now";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "minute"],
    [3600, "hour"],
    [86_400, "day"],
    [2_592_000, "month"],
  ];

  const formatter = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

  for (let index = 0; index < units.length; index += 1) {
    const [divisor, unit] = units[index];
    const next = units[index + 1]?.[0] ?? Infinity;
    if (seconds < next) return formatter.format(-Math.round(seconds / divisor), unit);
  }

  return formatter.format(-Math.round(seconds / 31_536_000), "year");
}
