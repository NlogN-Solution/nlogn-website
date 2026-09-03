"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowUp, Info, Minus, PlugZap } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { formatCompact, formatDelta, formatDuration, formatNumber, formatPercent, formatPosition, relativeTime, type Delta } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * The dashboard's shared pieces.
 *
 * Written against the admin's existing tokens — same surfaces, same line
 * colour, same type scale — so this reads as another part of the CMS rather
 * than a bolted-on analytics product.
 */

export type MetricUnit = "count" | "rate" | "position" | "duration";

export function formatMetric(value: number, unit: MetricUnit): string {
  if (unit === "rate") return formatPercent(value);
  if (unit === "position") return formatPosition(value);
  if (unit === "duration") return formatDuration(value);
  return formatNumber(value);
}

/* ── metric card ─────────────────────────────────────────────────────────── */

/**
 * One number, its change, and where it came from.
 *
 * The arrow shows *direction* and the colour shows *sentiment*, which are not
 * the same thing — average position rising is an arrow up painted red, because
 * position 8 is worse than position 6. `Delta.sentiment` has already worked
 * that out; this only renders it.
 */
export function MetricCard({
  label,
  delta,
  unit = "count",
  source,
  unavailable,
  hint,
  compact,
}: {
  label: string;
  delta: Delta | null;
  unit?: MetricUnit;
  source?: string;
  unavailable?: string;
  hint?: string;
  compact?: boolean;
}) {
  if (!delta) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-4">
        <p className="text-[0.8125rem] font-medium text-ink-soft">{label}</p>
        <p className="mt-2 text-[0.75rem] leading-relaxed text-muted">
          {unavailable ?? "Not available yet."}
        </p>
      </div>
    );
  }

  const tone =
    delta.sentiment === "positive"
      ? "text-emerald-700"
      : delta.sentiment === "negative"
        ? "text-red-700"
        : "text-muted";

  const Arrow = delta.direction === "up" ? ArrowUp : delta.direction === "down" ? ArrowDown : Minus;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.8125rem] font-medium text-ink-soft">{label}</p>
        {hint && (
          <span title={hint} className="shrink-0 cursor-help text-muted">
            <Info className="size-3.5" aria-hidden />
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-2 font-display font-extrabold tracking-[-0.03em] text-ink",
          compact ? "text-xl" : "text-2xl",
        )}
      >
        {unit === "count" && delta.current >= 10_000
          ? formatCompact(delta.current)
          : formatMetric(delta.current, unit)}
      </p>

      <p className={cn("mt-1 flex items-center gap-1 text-[0.75rem] font-medium", tone)}>
        <Arrow className="size-3" aria-hidden />
        <span>{formatDelta(delta, unit)}</span>
        {delta.direction !== "flat" && (
          <span className="font-normal text-muted">vs previous period</span>
        )}
      </p>

      {source && <p className="mt-2 text-[0.6875rem] text-muted">{source}</p>}
    </div>
  );
}

/* ── section frame ───────────────────────────────────────────────────────── */

export function Section({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mt-6 scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1rem] font-bold tracking-[-0.015em] text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 max-w-2xl text-[0.8125rem] leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── states ──────────────────────────────────────────────────────────────── */

/**
 * A provider that is not connected. Deliberately not an error: it is a normal
 * state with an action attached, so it gets a calm panel and a button rather
 * than a red banner.
 */
export function NotConnected({
  reason,
  websiteId,
  label = "Open integrations",
}: {
  reason: string;
  websiteId?: string;
  label?: string;
}) {
  return (
    <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-violet-wash text-violet">
        <PlugZap className="size-5" aria-hidden />
      </span>
      <p className="max-w-md text-[0.8125rem] leading-relaxed text-ink-soft">{reason}</p>
      {websiteId && (
        <Link
          href={`/admin/seo/${websiteId}/integrations`}
          className="rounded-lg bg-ink px-4 py-2 text-[0.8125rem] font-medium text-white transition-colors hover:bg-violet"
        >
          {label}
        </Link>
      )}
    </Panel>
  );
}

/**
 * "Last updated 6 hours ago."
 *
 * Shown whenever a panel is serving cached data past its refresh window,
 * because a stale number that says so is useful and a stale number that does
 * not is a lie with a timestamp missing.
 */
export function StaleNotice({ fetchedAt, error }: { fetchedAt?: string; error?: string }) {
  if (!fetchedAt) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-amber-700">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      <span>
        {error ? `${error} Showing the last data we successfully loaded — ` : "This data may be out of date — "}
        last updated {relativeTime(fetchedAt)}.
      </span>
    </p>
  );
}

export function DataNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[0.75rem] leading-relaxed text-muted">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Marks a number this application worked out, as opposed to one a provider reported. */
export function DerivedBadge({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="ml-1.5 cursor-help rounded border border-line bg-canvas px-1 py-px align-middle text-[0.625rem] font-medium uppercase tracking-wide text-muted"
    >
      Calculated
    </span>
  );
}

/* ── skeletons ───────────────────────────────────────────────────────────── */

/** Charts never render an empty frame while loading — that reads as "no traffic". */
export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-gradient-to-b from-canvas-2 to-canvas"
      style={{ height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="h-3 w-20 animate-pulse rounded bg-line" />
      <div className="mt-3 h-6 w-24 animate-pulse rounded bg-line" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-line" />
    </div>
  );
}

export function CardGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Wide tables scroll inside their own frame — the page itself never does. */
export function ScrollArea({ children }: { children: ReactNode }) {
  return <div className="-mx-px overflow-x-auto">{children}</div>;
}
