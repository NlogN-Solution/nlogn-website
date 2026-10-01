"use client";

import { Panel, PanelHeader } from "@/components/admin/ui";
import { BarList, Legend, LineChart } from "@/components/admin/seo/charts";
import {
  ChartSkeleton,
  DataNote,
  MetricCard,
  NotConnected,
  Section,
  StaleNotice,
} from "@/components/admin/seo/ui";
import { useEndpoint, type Delta, type Reported } from "@/components/admin/seo/hooks";
import { countryName } from "@/lib/country-names";
import { formatCompact, formatNumber } from "@/lib/metrics";

/**
 * Traffic, from Google Analytics 4.
 *
 * This reads the Data API, which is a different thing from the tracking tag the
 * public site already runs. The tag is untouched by any of this.
 */

type PageRow = { path: string; title: string; views: number; users: number };
type BreakdownRow = { key: string; users: number; sessions: number };

type AnalyticsOverview = {
  users: Delta;
  newUsers: Delta;
  sessions: Delta;
  engagementRate: Delta;
  avgEngagementTime: Delta;
  pageViews: Delta;
  organicUsers: Delta;
  directUsers: Delta;
  referralUsers: Delta;
  conversions: Delta | null;
  channels: { channel: string; users: number; sessions: number }[];
  devices: BreakdownRow[];
  countries: BreakdownRow[];
  topPages: PageRow[];
  landingPages: PageRow[];
  series: { date: string; users: number; newUsers: number; sessions: number; pageViews: number }[];
  lagDays: number;
};

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export function TrafficSection({
  websiteId,
  rangeParams,
  version,
}: {
  websiteId: string;
  rangeParams: Record<string, string>;
  version: number;
}) {
  const { data, loading } = useEndpoint<{ overview: Reported<AnalyticsOverview> }>(
    `/api/admin/websites/${websiteId}/analytics/overview`,
    { ...rangeParams, v: version },
  );

  if (loading && !data) {
    return (
      <Section title="Traffic Overview">
        <Panel className="p-5">
          <ChartSkeleton />
        </Panel>
      </Section>
    );
  }

  if (!data) return null;

  if (!data.overview.connected) {
    return (
      <Section title="Traffic Overview" description="Visitors to your website.">
        <NotConnected reason={data.overview.reason} websiteId={websiteId} />
      </Section>
    );
  }

  const report = data.overview.data;
  const labels = report.series.map((point) => point.date);

  const series = [
    { name: "Users", colorIndex: 0, values: report.series.map((point) => point.users) },
    { name: "New users", colorIndex: 1, values: report.series.map((point) => point.newUsers) },
    { name: "Sessions", colorIndex: 2, values: report.series.map((point) => point.sessions) },
  ];

  return (
    <Section title="Traffic Overview" description="Who visited your website, and how they found it.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Users" delta={report.users} compact />
        <MetricCard label="New users" delta={report.newUsers} compact />
        <MetricCard label="Sessions" delta={report.sessions} compact />
        <MetricCard label="Page views" delta={report.pageViews} compact />
        <MetricCard
          label="Engagement rate"
          delta={report.engagementRate}
          unit="rate"
          compact
          hint="The share of visits where someone stayed a while, viewed more than one page, or triggered a key event."
        />
        <MetricCard
          label="Average engagement time"
          delta={report.avgEngagementTime}
          unit="duration"
          compact
        />
        <MetricCard label="Organic users" delta={report.organicUsers} compact />
        {report.conversions ? (
          <MetricCard label="Key events" delta={report.conversions} compact />
        ) : (
          <MetricCard
            label="Key events"
            delta={null}
            unavailable="No key events are configured in this Analytics property, so there is nothing to count yet."
          />
        )}
      </div>

      <Panel className="mt-3 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.8125rem] font-medium text-ink">Visitors over time</span>
          <Legend series={series} />
        </div>

        <LineChart
          labels={labels}
          series={series}
          formatValue={formatCompact}
          formatLabel={shortDate}
          height={240}
        />

        <StaleNotice
          fetchedAt={data.overview.stale ? data.overview.fetchedAt : undefined}
          error={data.overview.error}
        />
      </Panel>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="How people arrive" description="Users by channel" />
          <div className="p-5">
            <BarList
              rows={report.channels.slice(0, 8).map((row) => ({
                label: row.channel,
                value: row.users,
              }))}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Devices" description="Users by device type" />
          <div className="p-5">
            <BarList
              rows={report.devices.map((row) => ({
                label: row.key.charAt(0).toUpperCase() + row.key.slice(1),
                value: row.users,
              }))}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Where visitors are" description="Users by country" />
          <div className="p-5">
            <BarList
              rows={report.countries.slice(0, 8).map((row) => ({
                // GA4 already returns full country names here, unlike Search
                // Console; the helper passes anything it does not recognise
                // straight through.
                label: row.key.length === 3 ? countryName(row.key) : row.key,
                value: row.users,
              }))}
              emptyLabel="Google withholds location data until a site has enough visitors for it to be anonymous. This will fill in as traffic grows."
            />
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Top pages" description="By page views" />
          <PageTable rows={report.topPages} metric="Views" />
        </Panel>

        <Panel>
          <PanelHeader title="Top landing pages" description="Where visits begin" />
          <PageTable rows={report.landingPages} metric="Sessions" />
        </Panel>
      </div>

      <DataNote>
        Analytics only counts visitors who accepted cookies on your site, so these figures are
        lower than the true number of visitors. Data is finalised about {report.lagDays} day
        {report.lagDays === 1 ? "" : "s"} late.
      </DataNote>
    </Section>
  );
}

function PageTable({ rows, metric }: { rows: PageRow[]; metric: string }) {
  if (rows.length === 0) {
    return <p className="px-5 py-8 text-center text-[0.8125rem] text-muted">No page data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] text-[0.8125rem]">
        <thead>
          <tr className="border-b border-line text-left text-[0.6875rem] uppercase tracking-wide text-muted">
            <th scope="col" className="px-5 py-2 font-semibold">Page</th>
            <th scope="col" className="px-5 py-2 text-right font-semibold">{metric}</th>
            <th scope="col" className="px-5 py-2 text-right font-semibold">Users</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.slice(0, 10).map((row) => (
            <tr key={row.path}>
              <td className="max-w-0 px-5 py-2.5">
                <span className="block truncate text-ink" title={row.title || row.path}>
                  {row.path || "/"}
                </span>
                {row.title && (
                  <span className="block truncate text-[0.6875rem] text-muted">{row.title}</span>
                )}
              </td>
              <td className="px-5 py-2.5 text-right font-mono text-[0.75rem] text-ink">
                {formatNumber(row.views)}
              </td>
              <td className="px-5 py-2.5 text-right font-mono text-[0.75rem] text-muted">
                {formatNumber(row.users)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
