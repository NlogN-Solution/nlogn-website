"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/admin/ui";
import { LineChart, SmallMultiples, BarList } from "@/components/admin/seo/charts";
import { ChartSkeleton, DataNote, NotConnected, StaleNotice, Section } from "@/components/admin/seo/ui";
import { useEndpoint, type Delta, type Reported } from "@/components/admin/seo/hooks";
import { formatCompact, formatNumber, formatPercent, formatPosition } from "@/lib/metrics";
import { countryName } from "@/lib/country-names";
import { cn } from "@/lib/utils";

/**
 * Google Search Performance.
 *
 * Clicks and impressions are drawn as two aligned panels rather than one chart
 * with two y-axes. They differ by an order of magnitude, and a shared frame
 * would put a crossover on screen that is a property of the scales rather than
 * of the site.
 */

type SearchOverview = {
  clicks: Delta;
  impressions: Delta;
  ctr: Delta;
  position: Delta;
  series: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
  lagDays: number;
};

type DimensionRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };

type Response = {
  overview: Reported<SearchOverview>;
  breakdowns: Reported<{ countries: DimensionRow[]; devices: DimensionRow[] }>;
};

type Granularity = "daily" | "weekly";

/** Monday-start ISO weeks, matching `groupByWeek` on the server. */
function toWeekly<T extends { date: string }>(points: T[], sum: (items: T[]) => Omit<T, "date">) {
  const buckets = new Map<string, T[]>();

  for (const point of points) {
    const date = new Date(`${point.date}T00:00:00Z`);
    const offset = (date.getUTCDay() + 6) % 7;
    const start = new Date(date.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
    buckets.set(start, [...(buckets.get(start) ?? []), point]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, ...sum(items) }) as T);
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export function SearchSection({
  websiteId,
  rangeParams,
  version,
}: {
  websiteId: string;
  rangeParams: Record<string, string>;
  version: number;
}) {
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/search-console/overview`,
    { ...rangeParams, v: version },
  );

  if (loading && !data) {
    return (
      <Section title="Google Search Performance">
        <Panel className="p-5">
          <ChartSkeleton />
        </Panel>
      </Section>
    );
  }

  if (!data) return null;

  if (!data.overview.connected) {
    return (
      <Section title="Google Search Performance">
        <NotConnected reason={data.overview.reason} websiteId={websiteId} />
      </Section>
    );
  }

  const report = data.overview.data;

  // Weekly totals for counts; impression-weighted means for the rates, because
  // averaging seven daily CTRs equally would let a quiet Sunday count as much
  // as a busy Tuesday.
  const points =
    granularity === "weekly"
      ? toWeekly(report.series, (items) => {
          const clicks = items.reduce((sum, item) => sum + item.clicks, 0);
          const impressions = items.reduce((sum, item) => sum + item.impressions, 0);
          const ranked = items.filter((item) => item.impressions > 0);
          return {
            clicks,
            impressions,
            ctr: impressions > 0 ? clicks / impressions : 0,
            position:
              ranked.length > 0
                ? ranked.reduce((sum, item) => sum + item.position * item.impressions, 0) /
                  ranked.reduce((sum, item) => sum + item.impressions, 0)
                : 0,
          };
        })
      : report.series;

  const labels = points.map((point) => point.date);

  return (
    <Section
      title="Google Search Performance"
      description="How your website performs in Google's search results."
      action={
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
          {(["daily", "weekly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={granularity === option}
              onClick={() => setGranularity(option)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[0.75rem] font-medium capitalize transition-colors",
                granularity === option
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-canvas hover:text-ink",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      }
    >
      <Panel className="p-5">
        <SmallMultiples
          panels={[
            {
              title: "Clicks",
              total: formatNumber(report.clicks.current),
              labels,
              values: points.map((point) => point.clicks),
              colorIndex: 0,
              formatValue: formatCompact,
              formatLabel: shortDate,
            },
            {
              title: "Impressions",
              total: formatNumber(report.impressions.current),
              labels,
              values: points.map((point) => point.impressions),
              colorIndex: 1,
              formatValue: formatCompact,
              formatLabel: shortDate,
            },
          ]}
        />

        <DataNote>
          Clicks and impressions are shown side by side rather than on one chart. They are measured
          on very different scales, and drawing them together would make them look related in ways
          they are not. Search Console data is finalised about {report.lagDays} days late, so the
          most recent days are never shown.
        </DataNote>

        <StaleNotice
          fetchedAt={data.overview.stale ? data.overview.fetchedAt : undefined}
          error={data.overview.error}
        />
      </Panel>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-[0.8125rem] font-medium text-ink">Click-through rate</span>
            <span className="font-display text-[0.9375rem] font-bold text-ink">
              {formatPercent(report.ctr.current)}
            </span>
          </div>
          <LineChart
            labels={labels}
            series={[{ name: "CTR", colorIndex: 2, values: points.map((point) => point.ctr) }]}
            formatValue={(value) => `${(value * 100).toFixed(1)}%`}
            formatLabel={shortDate}
            height={180}
          />
          <p className="mt-1 text-[0.6875rem] text-muted">
            The share of people who clicked after seeing your site. Higher is better.
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-[0.8125rem] font-medium text-ink">Average position</span>
            <span className="font-display text-[0.9375rem] font-bold text-ink">
              {formatPosition(report.position.current)}
            </span>
          </div>
          <LineChart
            labels={labels}
            series={[
              {
                name: "Position",
                colorIndex: 0,
                // A day with no impressions has no position; a zero would draw
                // it as a perfect ranking.
                values: points.map((point) => (point.position === 0 ? null : point.position)),
              },
            ]}
            formatValue={(value) => value.toFixed(0)}
            formatLabel={shortDate}
            height={180}
            invertY
            zeroBased={false}
          />
          <p className="mt-1 text-[0.6875rem] text-muted">
            Your average ranking. The line rising means you are moving up the page — position 1 is
            the top.
          </p>
        </Panel>
      </div>

      {data.breakdowns.connected && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Where searches come from" description="Clicks by country" />
            <div className="p-5">
              <BarList
                rows={data.breakdowns.data.countries.slice(0, 8).map((row) => ({
                  label: countryName(row.key),
                  value: row.clicks,
                  sub: `${formatNumber(row.impressions)} impressions`,
                }))}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Device" description="Clicks by device type" />
            <div className="p-5">
              <BarList
                rows={data.breakdowns.data.devices.map((row) => ({
                  label: row.key.charAt(0) + row.key.slice(1).toLowerCase(),
                  value: row.clicks,
                  sub: formatPercent(row.ctr, 1),
                }))}
              />
            </div>
          </Panel>
        </div>
      )}
    </Section>
  );
}
