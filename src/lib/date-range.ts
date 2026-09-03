/**
 * Date ranges and previous-period comparison.
 *
 * Client-safe: no Node imports, so the range picker and the sync jobs agree on
 * exactly what "last 28 days" means rather than each deciding for itself.
 *
 * Two rules run through everything here:
 *
 *  - Ranges are measured in **days**, never calendar months, so "last 3 months"
 *    and the 3 months before it are the same length. Comparing a 92-day quarter
 *    against an 89-day one produces a percentage change that is partly just the
 *    calendar, which is not a difference anybody asked about.
 *  - Ranges end **yesterday** (UTC), never today. Today is a partial day and
 *    would drag every trend down for no reason. Search Console is further
 *    behind still; `SEARCH_CONSOLE_LAG_DAYS` handles that separately.
 */

export const RANGE_PRESETS = {
  "7d": { label: "Last 7 days", days: 7 },
  "28d": { label: "Last 28 days", days: 28 },
  "3m": { label: "Last 3 months", days: 90 },
  "6m": { label: "Last 6 months", days: 180 },
  "12m": { label: "Last 12 months", days: 365 },
} as const;

export type RangePreset = keyof typeof RANGE_PRESETS;

export const DEFAULT_RANGE: RangePreset = "28d";

/**
 * Search Console finalises data two to three days late. Asking for yesterday
 * returns zeroes, which reads as a traffic collapse rather than as missing
 * data — so Search Console requests end three days back and the UI says so.
 */
export const SEARCH_CONSOLE_LAG_DAYS = 3;

/** GA4 is fresher but not instant; 1 full day back is reliable. */
export const ANALYTICS_LAG_DAYS = 1;

export type DateRange = {
  /** Inclusive, `YYYY-MM-DD`. */
  start: string;
  /** Inclusive, `YYYY-MM-DD`. */
  end: string;
  days: number;
};

export type ComparedRange = {
  current: DateRange;
  previous: DateRange;
  label: string;
  preset: RangePreset | "custom";
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Everything is computed in UTC so a server timezone change cannot shift a report. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addDays(iso: string, delta: number): string {
  return toIsoDate(new Date(fromIsoDate(iso).getTime() + delta * DAY_MS));
}

export function daysBetween(start: string, end: string): number {
  return Math.round((fromIsoDate(end).getTime() - fromIsoDate(start).getTime()) / DAY_MS) + 1;
}

/** The most recent day a provider has settled data for. */
export function latestAvailableDay(lagDays: number, now = new Date()): string {
  return toIsoDate(new Date(now.getTime() - lagDays * DAY_MS));
}

/**
 * Builds a range and the equally-long window immediately before it.
 *
 * `lagDays` shifts the whole pair back so a provider's reporting delay does not
 * land as an apparent drop — and shifts *both* windows, so the comparison stays
 * like-for-like.
 */
export function buildRange(
  preset: RangePreset,
  { lagDays = 0, now = new Date() }: { lagDays?: number; now?: Date } = {},
): ComparedRange {
  const { label, days } = RANGE_PRESETS[preset];
  const end = latestAvailableDay(lagDays + 1, now);
  const start = addDays(end, -(days - 1));

  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));

  return {
    current: { start, end, days },
    previous: { start: previousStart, end: previousEnd, days },
    label,
    preset,
  };
}

/** Same contract as `buildRange`, for a user-picked window. */
export function buildCustomRange(start: string, end: string): ComparedRange {
  const days = daysBetween(start, end);
  const previousEnd = addDays(start, -1);

  return {
    current: { start, end, days },
    previous: { start: addDays(previousEnd, -(days - 1)), end: previousEnd, days },
    label: `${start} – ${end}`,
    preset: "custom",
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The one place a range is derived from query parameters, shared by every
 * endpoint. Anything unparseable falls back to the default rather than
 * erroring — a bad `?range=` should not blank a dashboard.
 *
 * Custom ranges are clamped to 16 months, which is all Search Console retains;
 * asking for more returns nothing and looks like a bug.
 */
export function parseRange(
  params: URLSearchParams,
  { lagDays = 0, now = new Date() }: { lagDays?: number; now?: Date } = {},
): ComparedRange {
  const preset = params.get("range");

  if (preset === "custom") {
    const start = params.get("start");
    const end = params.get("end");

    if (start && end && ISO_DATE.test(start) && ISO_DATE.test(end) && start <= end) {
      const maxStart = addDays(latestAvailableDay(lagDays, now), -487);
      return buildCustomRange(start < maxStart ? maxStart : start, end);
    }
  }

  if (preset && preset in RANGE_PRESETS) {
    return buildRange(preset as RangePreset, { lagDays, now });
  }

  return buildRange(DEFAULT_RANGE, { lagDays, now });
}

/** Every list of dates a chart needs, including days a provider returned nothing for. */
export function eachDay(range: DateRange): string[] {
  const out: string[] = [];
  for (let cursor = range.start; cursor <= range.end; cursor = addDays(cursor, 1)) {
    out.push(cursor);
  }
  return out;
}

/**
 * Collapses daily points into ISO weeks. Twelve months of daily dots is noise;
 * the same year by week is a trend, which is why the charts offer both.
 */
export function groupByWeek<T extends { date: string }>(points: T[]): { date: string; items: T[] }[] {
  const buckets = new Map<string, T[]>();

  for (const point of points) {
    const date = fromIsoDate(point.date);
    // Monday-start weeks: getUTCDay() is 0 on Sunday, which belongs to the week before.
    const offset = (date.getUTCDay() + 6) % 7;
    const weekStart = toIsoDate(new Date(date.getTime() - offset * DAY_MS));
    const bucket = buckets.get(weekStart);
    if (bucket) bucket.push(point);
    else buckets.set(weekStart, [point]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }));
}
