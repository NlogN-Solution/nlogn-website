"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHART_INK, SERIES } from "@/components/admin/seo/palette";
import { cn } from "@/lib/utils";

/**
 * Charts, drawn as SVG with no charting library.
 *
 * Three reasons that is the right call here rather than stubbornness: this
 * codebase already hand-draws SVG (`components/ui/growth-curve.tsx`), Recharts
 * and its D3 dependencies would be the largest thing in the admin bundle by
 * some margin, and the whole requirement is four line charts and a bar list.
 *
 * The rule that shapes the API: **there is no dual-axis chart here.** Clicks
 * and impressions differ by an order of magnitude, and plotting them on two
 * y-scales lets the reader infer a crossover that is an artefact of the scales
 * chosen. `SmallMultiples` renders them as two aligned charts instead — same
 * x-axis, honest y-axes, and the shapes remain directly comparable.
 */

/* ── measurement ─────────────────────────────────────────────────────────── */

/** Charts need real pixels: a viewBox stretch would distort stroke widths. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/* ── scales ──────────────────────────────────────────────────────────────── */

/** Axis ticks on 1/2/5×10ⁿ, so labels read as round numbers. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];

  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;

  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.5; value += step) ticks.push(value);
  return ticks;
}

export type Series = {
  name: string;
  /** Index into SERIES; assigned by the caller and stable across filters. */
  colorIndex: number;
  values: (number | null)[];
};

export type LineChartProps = {
  labels: string[];
  series: Series[];
  height?: number;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
  /**
   * Rank scales invert: 1 is the best position, so the axis runs downward and
   * the "good" direction is up the page, as a reader expects.
   */
  invertY?: boolean;
  /** Forces the y-axis to start above zero — right for average position. */
  zeroBased?: boolean;
  className?: string;
};

const PADDING = { top: 12, right: 12, bottom: 26, left: 46 };

export function LineChart({
  labels,
  series,
  height = 220,
  formatValue = (value) => value.toLocaleString("en-GB"),
  formatLabel = (label) => label,
  invertY = false,
  zeroBased = true,
  className,
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const { min, max, ticks } = useMemo(() => {
    const values = series.flatMap((line) => line.values.filter((v): v is number => v !== null));

    if (values.length === 0) return { min: 0, max: 1, ticks: [0, 1] };

    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    if (zeroBased) {
      const top = highest === 0 ? 1 : highest;
      const tickValues = niceTicks(top);
      return { min: 0, max: tickValues[tickValues.length - 1], ticks: tickValues };
    }

    // A rank axis padded by a tenth of its span, so the line is not pinned to
    // the frame edge and small movements stay visible.
    const pad = Math.max(1, (highest - lowest) * 0.1);
    return {
      min: Math.max(0, lowest - pad),
      max: highest + pad,
      ticks: niceTicks(highest + pad, 4).filter((tick) => tick >= Math.max(0, lowest - pad)),
    };
  }, [series, zeroBased]);

  const x = useCallback(
    (index: number) =>
      PADDING.left + (labels.length <= 1 ? plotWidth / 2 : (index / (labels.length - 1)) * plotWidth),
    [labels.length, plotWidth],
  );

  const y = useCallback(
    (value: number) => {
      const ratio = max === min ? 0.5 : (value - min) / (max - min);
      return PADDING.top + (invertY ? ratio : 1 - ratio) * plotHeight;
    },
    [max, min, invertY, plotHeight],
  );

  /** Breaks the path at nulls, so a gap in the data reads as a gap. */
  const path = useCallback(
    (values: (number | null)[]) => {
      let d = "";
      let open = false;

      values.forEach((value, index) => {
        if (value === null) {
          open = false;
          return;
        }
        d += `${open ? "L" : "M"}${x(index).toFixed(2)},${y(value).toFixed(2)}`;
        open = true;
      });

      return d;
    },
    [x, y],
  );

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientX - bounds.left - PADDING.left;
    const index = Math.round((position / plotWidth) * (labels.length - 1));
    setHover(index >= 0 && index < labels.length ? index : null);
  };

  // Roughly one label per 80px, so a narrow chart thins them out instead of
  // overlapping — the failure mode that makes date axes unreadable.
  const labelStep = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(plotWidth / 80))));

  if (labels.length === 0) return <div ref={ref} style={{ height }} className={className} />;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`${series.map((s) => s.name).join(" and ")} over time`}
          className="touch-pan-y"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={CHART_INK.grid}
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill={CHART_INK.label}
              >
                {formatValue(tick)}
              </text>
            </g>
          ))}

          {labels.map((label, index) =>
            index % labelStep === 0 || index === labels.length - 1 ? (
              <text
                key={label}
                x={x(index)}
                y={height - 8}
                textAnchor={index === labels.length - 1 ? "end" : index === 0 ? "start" : "middle"}
                fontSize={10}
                fill={CHART_INK.label}
              >
                {formatLabel(label)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PADDING.top}
              y2={PADDING.top + plotHeight}
              stroke={CHART_INK.axis}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {series.map((line) => (
            <path
              key={line.name}
              d={path(line.values)}
              fill="none"
              stroke={SERIES[line.colorIndex % SERIES.length]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {hover !== null &&
            series.map((line) => {
              const value = line.values[hover];
              if (value === null || value === undefined) return null;
              return (
                <circle
                  key={line.name}
                  cx={x(hover)}
                  cy={y(value)}
                  r={4}
                  fill={SERIES[line.colorIndex % SERIES.length]}
                  // A 2px surface ring keeps overlapping markers separable.
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            })}
        </svg>
      )}

      {hover !== null && (
        <Tooltip
          x={x(hover)}
          width={width}
          label={formatLabel(labels[hover])}
          rows={series.map((line) => ({
            name: line.name,
            color: SERIES[line.colorIndex % SERIES.length],
            value: line.values[hover] === null ? "No data" : formatValue(line.values[hover]!),
          }))}
        />
      )}
    </div>
  );
}

function Tooltip({
  x,
  width,
  label,
  rows,
}: {
  x: number;
  width: number;
  label: string;
  rows: { name: string; color: string; value: string }[];
}) {
  // Flips to the left of the crosshair near the right edge rather than being
  // clipped by the panel.
  const flip = x > width - 150;

  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-[8rem] rounded-lg border border-line bg-surface px-3 py-2 shadow-lift"
      style={flip ? { right: width - x + 8 } : { left: x + 8 }}
    >
      <p className="mb-1 text-[0.6875rem] font-medium text-muted">{label}</p>
      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-2 py-0.5">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <span className="min-w-0 flex-1 truncate text-[0.6875rem] text-ink-soft">{row.name}</span>
          <span className="shrink-0 font-mono text-[0.6875rem] font-semibold text-ink">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Identity is never carried by colour alone — the swatch always has its name. */
export function Legend({ series }: { series: { name: string; colorIndex: number }[] }) {
  if (series.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((line) => (
        <span key={line.name} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: SERIES[line.colorIndex % SERIES.length] }}
          />
          <span className="text-[0.75rem] text-ink-soft">{line.name}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Two measures side by side, each on its own honest scale.
 *
 * This is the alternative to a dual-axis chart, and the reason one does not
 * appear anywhere in this dashboard: clicks and impressions differ by an order
 * of magnitude, so a shared frame with two y-scales would let a reader see the
 * lines cross and conclude something happened. Nothing happened — the scales
 * were chosen. Two panels keep both shapes readable and claim nothing.
 */
export function SmallMultiples({
  panels,
}: {
  panels: {
    title: string;
    total: string;
    labels: string[];
    values: (number | null)[];
    colorIndex: number;
    formatValue?: (value: number) => string;
    formatLabel?: (label: string) => string;
    invertY?: boolean;
    zeroBased?: boolean;
  }[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {panels.map((panel) => (
        <div key={panel.title} className="min-w-0">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: SERIES[panel.colorIndex % SERIES.length] }}
              />
              <span className="text-[0.8125rem] font-medium text-ink">{panel.title}</span>
            </span>
            <span className="font-display text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">
              {panel.total}
            </span>
          </div>
          <LineChart
            labels={panel.labels}
            series={[{ name: panel.title, colorIndex: panel.colorIndex, values: panel.values }]}
            formatValue={panel.formatValue}
            formatLabel={panel.formatLabel}
            invertY={panel.invertY}
            zeroBased={panel.zeroBased}
            height={180}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * A ranked list of magnitudes — traffic channels, devices, countries.
 *
 * Deliberately one hue rather than one colour per row. The rows are the same
 * kind of thing measured on the same scale, so colour would encode rank, and
 * colour that follows rank repaints itself whenever a filter reorders the list.
 */
export function BarList({
  rows,
  formatValue = (value) => value.toLocaleString("en-GB"),
  emptyLabel = "No data for this period.",
}: {
  rows: { label: string; value: number; sub?: string }[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[0.8125rem] text-muted">{emptyLabel}</p>;
  }

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[0.8125rem] text-ink-soft">{row.label}</span>
            <span className="shrink-0 font-mono text-[0.75rem] font-semibold text-ink">
              {formatValue(row.value)}
              {row.sub && <span className="ml-1.5 font-sans font-normal text-muted">{row.sub}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-canvas-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${(row.value / max) * 100}%`, backgroundColor: SERIES[0] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
