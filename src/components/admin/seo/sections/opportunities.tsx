"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Panel, PanelHeader, SkeletonRows } from "@/components/admin/ui";
import { DataNote, DerivedBadge, NotConnected, Section } from "@/components/admin/seo/ui";
import { useEndpoint } from "@/components/admin/seo/hooks";
import { formatNumber, formatPercent, formatPosition } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * "What should I work on next?"
 *
 * Each card quotes the numbers Google reported and then says, in `basis`,
 * which part of the reasoning is ours. That distinction is the whole point of
 * the section: the metrics are facts, the ranking of them into opportunities
 * is an opinion, and a client is entitled to know which is which.
 */

type OpportunityKind =
  | "close-to-page-one"
  | "high-impressions-low-ctr"
  | "high-ctr-low-position"
  | "declining";

type Opportunity = {
  kind: OpportunityKind;
  keyword: string;
  page?: string;
  headline: string;
  recommendation: string;
  basis: string;
  metrics: {
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
    positionChange?: number | null;
    benchmarkCtr?: number;
  };
};

type Response =
  | { connected: false; reason: string }
  | {
      connected: true;
      opportunities: Opportunity[];
      labels: Record<OpportunityKind, { title: string; blurb: string }>;
      benchmarkAvailable: boolean;
    };

const KIND_TONE: Record<OpportunityKind, string> = {
  "close-to-page-one": "border-violet/30 bg-violet-wash text-violet-deep",
  "high-impressions-low-ctr": "border-amber-200 bg-amber-50 text-amber-800",
  "high-ctr-low-position": "border-emerald-200 bg-emerald-50 text-emerald-800",
  declining: "border-red-200 bg-red-50 text-red-800",
};

export function OpportunitiesSection({
  websiteId,
  rangeParams,
  version,
}: {
  websiteId: string;
  rangeParams: Record<string, string>;
  version: number;
}) {
  const [filter, setFilter] = useState<OpportunityKind | "all">("all");

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/seo/opportunities`,
    { ...rangeParams, v: version },
  );

  if (loading && !data) {
    return (
      <Section title="SEO Opportunities">
        <Panel>
          <SkeletonRows rows={4} cols={3} />
        </Panel>
      </Section>
    );
  }

  if (!data) return null;

  if (!data.connected) {
    return (
      <Section title="SEO Opportunities">
        <NotConnected reason={data.reason} websiteId={websiteId} />
      </Section>
    );
  }

  const kinds = Object.keys(data.labels) as OpportunityKind[];
  const counts = Object.fromEntries(
    kinds.map((kind) => [kind, data.opportunities.filter((item) => item.kind === kind).length]),
  ) as Record<OpportunityKind, number>;

  const shown =
    filter === "all" ? data.opportunities : data.opportunities.filter((item) => item.kind === filter);

  return (
    <Section
      title="SEO Opportunities"
      description="Specific things worth doing next, worked out from your Search Console data."
    >
      <Panel>
        <PanelHeader
          title="What to work on"
          description={`${data.opportunities.length} opportunities found, most valuable first`}
        />

        {data.opportunities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Lightbulb className="size-5 text-muted" aria-hidden />
            <p className="max-w-md text-[0.8125rem] leading-relaxed text-muted">
              Nothing stands out in this period. That usually means either the site is performing
              consistently or there is not yet enough search data to spot a pattern. Try a longer
              date range.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-3">
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="All"
                count={data.opportunities.length}
              />
              {kinds.map((kind) =>
                counts[kind] > 0 ? (
                  <FilterChip
                    key={kind}
                    active={filter === kind}
                    onClick={() => setFilter(kind)}
                    label={data.labels[kind].title}
                    count={counts[kind]}
                  />
                ) : null,
              )}
            </div>

            <ul className="divide-y divide-line">
              {shown.map((item, index) => (
                <li key={`${item.kind}-${item.keyword}-${index}`} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-[0.875rem] font-medium leading-snug text-ink">
                      {item.headline}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium",
                        KIND_TONE[item.kind],
                      )}
                    >
                      {data.labels[item.kind].title}
                    </span>
                  </div>

                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                    <Stat label="Position" value={formatPosition(item.metrics.position)} />
                    <Stat label="Impressions" value={formatNumber(item.metrics.impressions)} />
                    <Stat label="Clicks" value={formatNumber(item.metrics.clicks)} />
                    <Stat label="CTR" value={formatPercent(item.metrics.ctr)} />
                    {item.metrics.benchmarkCtr !== undefined && (
                      <Stat
                        label="Your typical CTR here"
                        value={formatPercent(item.metrics.benchmarkCtr)}
                      />
                    )}
                  </dl>

                  <p className="mt-2 max-w-3xl text-[0.8125rem] leading-relaxed text-ink-soft">
                    {item.recommendation}
                  </p>

                  <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">{item.basis}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <DataNote>
        Which keywords count as an opportunity is our judgement
        <DerivedBadge title="These groupings are calculated by this dashboard from Search Console metrics. Google does not publish an 'opportunities' report." />
        , not something Google reports. Every number quoted above comes straight from Search
        Console.
        {!data.benchmarkAvailable &&
          " There are not yet enough keywords on this site to work out its own typical click-through rate, so the click-through comparisons are not shown."}
      </DataNote>
    </Section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-line text-ink-soft hover:border-ink/25 hover:bg-canvas",
      )}
    >
      {label}
      <span className={cn("ml-1.5", active ? "text-white/70" : "text-muted")}>{count}</span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-muted">{label}</dt>
      <dd className="font-mono text-[0.8125rem] font-semibold text-ink">{value}</dd>
    </div>
  );
}
