"use client";

import { useState } from "react";
import { Gauge, Monitor, Smartphone } from "lucide-react";
import { Panel, PanelHeader } from "@/components/admin/ui";
import { LineChart, Legend } from "@/components/admin/seo/charts";
import { ChartSkeleton, DataNote, Section } from "@/components/admin/seo/ui";
import { VITAL_TONE } from "@/components/admin/seo/palette";
import { useEndpoint } from "@/components/admin/seo/hooks";
import { relativeTime } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * Page speed and Core Web Vitals.
 *
 * Kept apart from search visibility and from traffic on purpose: a fast site is
 * not the same as a well-ranked site, and folding them into one figure would
 * make both unreadable.
 *
 * Lab and field measurements are shown as separate blocks rather than merged.
 * They answer different questions — a simulated run against one page, versus
 * what real visitors actually experienced — and INP exists only in the second,
 * so a quiet site genuinely has no INP to show.
 */

type Reading = { value: number | null; rating: "good" | "needs-improvement" | "poor" | null };

type Report = {
  strategy: "mobile" | "desktop";
  url: string;
  fetchedAt: string;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  lab: { lcp: Reading; fcp: Reading; cls: Reading; tbt: Reading; ttfb: Reading };
  field: { lcp: Reading; inp: Reading; cls: Reading; fcp: Reading; ttfb: Reading } | null;
};

type Response =
  | { available: false; reason: string }
  | {
      available: true;
      mobile: Report | null;
      desktop: Report | null;
      history: { date: string; mobile: number | null; desktop: number | null }[];
      fieldDataMissing: boolean;
    };

const formatMs = (value: number | null) =>
  value === null ? "—" : value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;

const formatCls = (value: number | null) => (value === null ? "—" : value.toFixed(3));

export function PerformanceSection({ websiteId, version }: { websiteId: string; version: number }) {
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/performance`,
    { v: version },
  );

  if (loading && !data) {
    return (
      <Section title="Performance">
        <Panel className="p-5">
          <ChartSkeleton height={160} />
        </Panel>
      </Section>
    );
  }

  if (!data) return null;

  if (!data.available) {
    return (
      <Section title="Performance" description="How quickly your website loads.">
        <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-violet-wash text-violet">
            <Gauge className="size-5" aria-hidden />
          </span>
          <p className="max-w-md text-[0.8125rem] leading-relaxed text-ink-soft">{data.reason}</p>
        </Panel>
      </Section>
    );
  }

  const report = strategy === "mobile" ? data.mobile : data.desktop;

  return (
    <Section
      title="Performance"
      description="How quickly your website loads. Separate from search rankings — this is about speed, not visibility."
      action={
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
          {(
            [
              { value: "mobile", label: "Mobile", Icon: Smartphone },
              { value: "desktop", label: "Desktop", Icon: Monitor },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={strategy === option.value}
              onClick={() => setStrategy(option.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
                strategy === option.value
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-canvas hover:text-ink",
              )}
            >
              <option.Icon className="size-3.5" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {!report ? (
        <Panel className="px-6 py-12 text-center text-[0.8125rem] text-muted">
          No {strategy} measurement has been taken yet.
        </Panel>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label="Performance" score={report.performanceScore} primary />
            <ScoreCard label="SEO" score={report.seoScore} />
            <ScoreCard label="Accessibility" score={report.accessibilityScore} />
            <ScoreCard label="Best practices" score={report.bestPracticesScore} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Panel>
              <PanelHeader
                title="What real visitors experienced"
                description="Core Web Vitals from Chrome, over the last 28 days"
              />
              <div className="p-5">
                {report.field ? (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Vital label="Largest Contentful Paint" short="LCP" reading={report.field.lcp} format={formatMs} help="How long until the main content appears." />
                    <Vital label="Interaction to Next Paint" short="INP" reading={report.field.inp} format={formatMs} help="How quickly the page responds when someone taps or clicks." />
                    <Vital label="Cumulative Layout Shift" short="CLS" reading={report.field.cls} format={formatCls} help="How much the page jumps around while loading." />
                    <Vital label="Time to First Byte" short="TTFB" reading={report.field.ttfb} format={formatMs} help="How long your server takes to start responding." />
                  </dl>
                ) : (
                  <p className="py-6 text-center text-[0.8125rem] leading-relaxed text-muted">
                    Google has not collected enough real-visitor data for this site yet. This needs
                    a steady stream of Chrome visitors before it appears, and its absence is not a
                    fault. The simulated measurements alongside are still valid.
                  </p>
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Simulated test"
                description="One measured run in a controlled browser"
              />
              <div className="p-5">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Vital label="Largest Contentful Paint" short="LCP" reading={report.lab.lcp} format={formatMs} help="How long until the main content appears." />
                  <Vital label="First Contentful Paint" short="FCP" reading={report.lab.fcp} format={formatMs} help="How long until anything at all appears." />
                  <Vital label="Cumulative Layout Shift" short="CLS" reading={report.lab.cls} format={formatCls} help="How much the page jumps around while loading." />
                  <Vital
                    label="Total Blocking Time"
                    short="TBT"
                    reading={report.lab.tbt}
                    format={formatMs}
                    help="How long the page was busy and unable to respond. A stand-in for responsiveness in a simulated test — it is not INP and has no official rating."
                  />
                </dl>
              </div>
            </Panel>
          </div>

          {data.history.length > 1 && (
            <Panel className="mt-3 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[0.8125rem] font-medium text-ink">
                  Performance score over time
                </span>
                <Legend
                  series={[
                    { name: "Mobile", colorIndex: 0 },
                    { name: "Desktop", colorIndex: 1 },
                  ]}
                />
              </div>
              <LineChart
                labels={data.history.map((point) => point.date)}
                series={[
                  { name: "Mobile", colorIndex: 0, values: data.history.map((p) => p.mobile) },
                  { name: "Desktop", colorIndex: 1, values: data.history.map((p) => p.desktop) },
                ]}
                formatValue={(value) => String(Math.round(value))}
                formatLabel={(iso) =>
                  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })
                }
                height={180}
              />
            </Panel>
          )}

          <DataNote>
            Measured {relativeTime(report.fetchedAt)} against {report.url}. A single simulated run
            varies by a few points between measurements, so treat the trend as the real signal
            rather than any one score.
          </DataNote>
        </>
      )}
    </Section>
  );
}

function ScoreCard({
  label,
  score,
  primary,
}: {
  label: string;
  score: number | null;
  primary?: boolean;
}) {
  // Google's own banding: 90+ green, 50–89 amber, below 50 red.
  const tone =
    score === null
      ? "text-muted"
      : score >= 90
        ? "text-emerald-700"
        : score >= 50
          ? "text-amber-700"
          : "text-red-700";

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[0.8125rem] font-medium text-ink-soft">{label}</p>
      <p
        className={cn(
          "mt-2 font-display font-extrabold tracking-[-0.03em]",
          primary ? "text-3xl" : "text-2xl",
          tone,
        )}
      >
        {score ?? "—"}
        {score !== null && <span className="ml-1 text-sm font-bold text-muted">/100</span>}
      </p>
    </div>
  );
}

function Vital({
  label,
  short,
  reading,
  format,
  help,
}: {
  label: string;
  short: string;
  reading: Reading;
  format: (value: number | null) => string;
  help: string;
}) {
  const tone = reading.rating ? VITAL_TONE[reading.rating] : null;

  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[0.75rem] text-muted" title={help}>
        <span className="font-mono font-semibold text-ink-soft">{short}</span>
        <span className="min-w-0 truncate">{label}</span>
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        <span className="font-display text-lg font-bold text-ink">{format(reading.value)}</span>
        {tone && (
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide",
              tone.className,
            )}
          >
            {tone.label}
          </span>
        )}
      </dd>
    </div>
  );
}
