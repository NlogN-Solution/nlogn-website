"use client";

import { Gauge, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { CardGridSkeleton, DataNote, MetricCard, StaleNotice } from "@/components/admin/seo/ui";
import { SEVERITY_COLOR } from "@/components/admin/seo/palette";
import { useEndpoint, type Delta } from "@/components/admin/seo/hooks";
import { SEVERITY_LABELS } from "@/config/seo-issues";
import type { IssueSeverity } from "@/generated/prisma";

/**
 * The answer to "how is my website doing?", in one screen of cards.
 *
 * Cards for providers that are not connected still render, saying what would
 * appear there and how to switch it on — a gap somebody can act on beats a
 * silently shorter row.
 */

type OverviewResponse = {
  cards: {
    key: string;
    label: string;
    delta: Delta | null;
    unit: "count" | "rate" | "position" | "duration";
    source: string;
    unavailable?: string;
  }[];
  health: {
    score: number | null;
    grade: string;
    components: { key: string; label: string; score: number; weight: number; detail: string }[];
    measured: number;
    possible: number;
    disclaimer: string;
  };
  issues: Record<IssueSeverity, number>;
  crawled: boolean;
  sources: {
    searchConsole: { connected: boolean; reason?: string; stale?: boolean; fetchedAt?: string };
    analytics: { connected: boolean; reason?: string; stale?: boolean; fetchedAt?: string };
    ahrefs: { available: boolean; reason?: string };
  };
};

const HINTS: Record<string, string> = {
  ctr: "The share of people who click your site after seeing it in Google's results.",
  position:
    "Your average ranking across every search that showed your site. Lower is better — 1 is the top of page one.",
  impressions: "How many times a page of yours appeared in Google's search results.",
  organicUsers: "Visitors who arrived from a search engine, as counted by Google Analytics.",
};

export function OverviewSection({
  websiteId,
  rangeParams,
  version,
}: {
  websiteId: string;
  rangeParams: Record<string, string>;
  version: number;
}) {
  const { data, loading, error } = useEndpoint<OverviewResponse>(
    `/api/admin/websites/${websiteId}/seo/overview`,
    { ...rangeParams, v: version },
  );

  if (loading && !data) return <CardGridSkeleton count={5} />;

  if (error && !data) {
    return (
      <Panel className="px-5 py-8 text-center text-[0.8125rem] text-muted">{error}</Panel>
    );
  }

  if (!data) return null;

  const gscStale = data.sources.searchConsole.stale;
  const gaStale = data.sources.analytics.stale;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.cards.map((card) => (
          <MetricCard
            key={card.key}
            label={card.label}
            delta={card.delta}
            unit={card.unit}
            source={card.source}
            unavailable={card.unavailable}
            hint={HINTS[card.key]}
          />
        ))}

        <HealthCard health={data.health} issues={data.issues} crawled={data.crawled} />
      </div>

      {(gscStale || gaStale) && (
        <StaleNotice
          fetchedAt={
            gscStale ? data.sources.searchConsole.fetchedAt : data.sources.analytics.fetchedAt
          }
        />
      )}

      {data.sources.analytics.connected && data.sources.searchConsole.connected && (
        <DataNote>
          Analytics and Search Console will not agree, and neither is wrong. Analytics only counts
          visitors who accepted cookies on your site; Search Console counts clicks at Google&rsquo;s
          end, before anyone reaches you.
        </DataNote>
      )}
    </>
  );
}

/** The health score, its grade, and — always — what went into it. */
function HealthCard({
  health,
  issues,
  crawled,
}: {
  health: OverviewResponse["health"];
  issues: Record<IssueSeverity, number>;
  crawled: boolean;
}) {
  const severities = Object.keys(SEVERITY_LABELS) as IssueSeverity[];
  const total = severities.reduce((sum, key) => sum + issues[key], 0);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-soft">
            <ShieldCheck className="size-3.5 text-violet" aria-hidden />
            NLOGN SEO Health Score
          </p>

          {health.score === null ? (
            <p className="mt-2 max-w-xs text-[0.75rem] leading-relaxed text-muted">
              Connect Search Console or run an audit and this score will appear.
            </p>
          ) : (
            <>
              <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-ink">
                {health.score}
                <span className="ml-1 text-sm font-bold text-muted">/100</span>
              </p>
              <p className="mt-0.5 text-[0.75rem] font-medium text-ink-soft">{health.grade}</p>
              <p className="mt-1 text-[0.6875rem] text-muted">
                From {health.measured} of {health.possible} possible measures
              </p>
            </>
          )}
        </div>

        {crawled && total > 0 && (
          <ul className="shrink-0 space-y-1">
            {severities.map((severity) =>
              issues[severity] > 0 ? (
                <li key={severity} className="flex items-center justify-end gap-2">
                  <span className="text-[0.6875rem] text-muted">{SEVERITY_LABELS[severity]}</span>
                  <span
                    className="min-w-[1.5rem] rounded px-1.5 py-0.5 text-center text-[0.6875rem] font-bold text-white"
                    style={{ backgroundColor: SEVERITY_COLOR[severity] }}
                  >
                    {issues[severity]}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>

      {health.components.length > 0 && (
        <details className="mt-3 border-t border-line pt-3">
          <summary className="cursor-pointer list-none text-[0.75rem] font-medium text-violet hover:underline">
            What makes up this score?
          </summary>

          <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">{health.disclaimer}</p>

          <ul className="mt-2 space-y-2">
            {health.components.map((component) => (
              <li key={component.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.75rem] font-medium text-ink-soft">
                    {component.label}
                    <span className="ml-1.5 font-normal text-muted">
                      {component.weight}% of the score
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.75rem] font-semibold text-ink">
                    {Math.round(component.score)}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted">
                  {component.detail}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!crawled && (
        <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-muted">
          <Gauge className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span>
            No technical audit has run yet. Run one from the integrations page to include technical
            health in this score.
          </span>
        </p>
      )}
    </div>
  );
}
