"use client";

import { Link2 } from "lucide-react";
import { Panel, PanelHeader, SkeletonRows } from "@/components/admin/ui";
import { BarList } from "@/components/admin/seo/charts";
import { DataNote, Section, StaleNotice } from "@/components/admin/seo/ui";
import { useEndpoint } from "@/components/admin/seo/hooks";
import { formatCompact, formatNumber } from "@/lib/metrics";

/**
 * Backlinks, from Ahrefs.
 *
 * On a free Ahrefs account this section shows an explanation rather than
 * numbers, because Ahrefs Webmaster Tools has no API — the data exists inside
 * Ahrefs' own interface and is not reachable programmatically. Filling the
 * space with an estimate would be inventing client data, so it stays empty and
 * says why.
 *
 * With a paid API token the same section renders whichever reports that plan
 * actually answered for. A metric the plan does not include is omitted, never
 * shown as zero.
 */

type Overview = {
  domainRating: number | null;
  urlRating: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  organicKeywords: number | null;
  organicTraffic: number | null;
  organicTrafficValue: number | null;
};

type Response =
  | { available: false; reason: string; plan: string | null }
  | {
      available: true;
      plan: string | null;
      overview: Overview;
      referringDomains: { domain: string; domainRating: number | null; links: number }[] | null;
      endpoints: string[];
      unitsUsed: number | null;
      unitsLimit: number | null;
      fetchedAt: string;
      stale: boolean;
    };

export function BacklinksSection({ websiteId, version }: { websiteId: string; version: number }) {
  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/backlinks`,
    { v: version },
  );

  if (loading && !data) {
    return (
      <Section title="Backlinks">
        <Panel>
          <SkeletonRows rows={3} cols={3} />
        </Panel>
      </Section>
    );
  }

  if (!data) return null;

  if (!data.available) {
    return (
      <Section title="Backlinks" description="Other websites linking to yours.">
        <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-canvas-2 text-muted">
            <Link2 className="size-5" aria-hidden />
          </span>
          <p className="max-w-lg text-[0.8125rem] leading-relaxed text-ink-soft">{data.reason}</p>
          <p className="max-w-lg text-[0.75rem] leading-relaxed text-muted">
            Nothing is shown here rather than an estimate, because an estimated backlink count
            would look like a measurement and is not one.
          </p>
        </Panel>
      </Section>
    );
  }

  const { overview } = data;

  const cards = [
    { label: "Domain Rating", value: overview.domainRating, format: (v: number) => String(v), hint: "Ahrefs' 0–100 measure of how strong your site's link profile is." },
    { label: "Backlinks", value: overview.backlinks, format: formatCompact },
    { label: "Referring domains", value: overview.referringDomains, format: formatCompact },
    { label: "Organic keywords", value: overview.organicKeywords, format: formatCompact },
    { label: "Estimated organic traffic", value: overview.organicTraffic, format: formatCompact, hint: "Ahrefs' own estimate, not a measurement of your actual visitors. Your Analytics figures are the real ones." },
  ].filter((card) => card.value !== null);

  return (
    <Section
      title="Backlinks"
      description="Other websites linking to yours, as reported by Ahrefs."
    >
      {cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[0.8125rem] font-medium text-ink-soft" title={card.hint}>
                {card.label}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-ink">
                {card.format(card.value!)}
              </p>
              <p className="mt-2 text-[0.6875rem] text-muted">Ahrefs</p>
            </div>
          ))}
        </div>
      )}

      {data.referringDomains && data.referringDomains.length > 0 && (
        <Panel className="mt-3">
          <PanelHeader
            title="Top referring domains"
            description="The sites sending you the most links"
          />
          <div className="p-5">
            <BarList
              rows={data.referringDomains.slice(0, 10).map((row) => ({
                label: row.domain,
                value: row.links,
                sub: row.domainRating !== null ? `DR ${row.domainRating}` : undefined,
              }))}
              formatValue={(value) => `${formatNumber(value)} links`}
            />
          </div>
        </Panel>
      )}

      <StaleNotice fetchedAt={data.stale ? data.fetchedAt : undefined} />

      <DataNote>
        {data.plan && `Ahrefs ${data.plan} plan. `}
        Only the reports this plan makes available are shown — anything it does not include is
        left out rather than estimated.
        {data.unitsLimit !== null &&
          ` ${formatNumber(data.unitsUsed ?? 0)} of ${formatNumber(data.unitsLimit)} API units used this month.`}
      </DataNote>
    </Section>
  );
}
