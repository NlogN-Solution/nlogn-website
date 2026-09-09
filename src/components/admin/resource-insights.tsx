"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye, Link2, MousePointerClick, Users } from "lucide-react";
import { api, ApiError, qs } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { PageHeader } from "@/components/admin/shell";
import {
  Banner,
  EmptyState,
  Panel,
  PanelHeader,
  SkeletonRows,
  StatusBadge,
} from "@/components/admin/ui";
import { RESOURCE_GATE_LABELS, type ResourceGateName } from "@/config/resources";

/**
 * Where the traffic goes after the reel.
 *
 * The four numbers are laid out in the order a visitor moves through them so
 * the gaps are readable at a glance, and each gap has a different fix:
 *
 *   clicks → views      the link works but the page does not load. Look at
 *                       weight, not copy.
 *   views → unlocks     the page loads but does not argue. Look at what is
 *                       promised above the gate.
 *   unlocks → downloads they gave an address and never took the file. Look at
 *                       delivery — this one is usually SMTP.
 *
 * A rate is only shown where the denominator is non-zero. "0%" and "nothing has
 * happened yet" are different statements and only one of them is true early on.
 */

type ResourceRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  gate: string;
  clicks: number;
  views: number;
  unlocks: number;
  downloads: number;
};

type CampaignRow = {
  code: string;
  platform: string | null;
  note: string | null;
  resourceTitle: string;
  resourceSlug: string;
  clicks: number;
  unlocks: number;
  lastClickAt: string | null;
};

type Insights = {
  totals: { clicks: number; views: number; unlocks: number; downloads: number };
  resources: ResourceRow[];
  campaigns: CampaignRow[];
  directUnlocks: number;
};

type Lead = {
  id: string;
  email: string;
  name: string | null;
  campaign: string | null;
  marketingConsent: boolean;
  createdAt: string;
  resource: { title: string; slug: string };
};

function rate(numerator: number, denominator: number) {
  if (denominator <= 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "2-digit",
});

export function ResourceInsights() {
  const toast = useToast();
  const [data, setData] = useState<Insights | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  /** Null until we know; false when the inbox capability is missing. */
  const [canReadLeads, setCanReadLeads] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<Insights>("/api/admin/resources/insights")
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        if (!cancelled) {
          toast(error instanceof ApiError ? error.message : "Could not load the funnel.", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    /*
     * Lead addresses sit behind `messages:read` while the counts above do not,
     * so this request is allowed to fail. A 403 means this person can see how
     * the library performs but not who is on the other end, which is the right
     * split — and it is shown as a note rather than an error, because nothing
     * has gone wrong.
     */
    api
      .get<{ items: Lead[] }>(`/api/admin/resources/leads${qs({ perPage: 10 })}`)
      .then((result) => {
        if (cancelled) return;
        setLeads(result.items);
        setCanReadLeads(true);
      })
      .catch((error) => {
        if (!cancelled) setCanReadLeads(!(error instanceof ApiError && error.status === 403));
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const totals = data?.totals;

  return (
    <>
      <PageHeader
        title="Resource funnel"
        description="Clicks from a reel through to a file on somebody's laptop. All time."
        action={
          <Link
            href="/admin/resources"
            className="text-[0.8125rem] font-medium text-violet transition-colors hover:text-ink"
          >
            Back to the library
          </Link>
        }
      />

      <dl className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={<MousePointerClick className="size-4" />}
          label="Short-link clicks"
          value={totals?.clicks}
          caption="Taps on a /r/ link"
        />
        <Metric
          icon={<Eye className="size-4" />}
          label="Page views"
          value={totals?.views}
          caption={totals ? `${rate(totals.views, totals.clicks)} of clicks arrived` : undefined}
        />
        <Metric
          icon={<Users className="size-4" />}
          label="Unlocks"
          value={totals?.unlocks}
          caption={totals ? `${rate(totals.unlocks, totals.views)} of viewers` : undefined}
        />
        <Metric
          icon={<Download className="size-4" />}
          label="Downloads"
          value={totals?.downloads}
          caption={totals ? `${rate(totals.downloads, totals.unlocks)} of unlocks` : undefined}
        />
      </dl>

      {data && data.totals.clicks === 0 && data.campaigns.length === 0 && (
        <div className="mb-4">
          <Banner tone="info">
            No short links yet. Open a resource and add one per video — without a code there is no
            way to tell which reel earned a download, because Instagram sends no referer worth
            having from its in-app browser.
          </Banner>
        </div>
      )}

      <div className="space-y-4">
        <Panel>
          <PanelHeader
            title="By campaign"
            description="One row per short link. Clicks to unlocks is how well the page converts the traffic a particular video sends."
          />
          {loading ? (
            <SkeletonRows rows={4} />
          ) : !data || data.campaigns.length === 0 ? (
            <EmptyState
              title="No short links yet"
              body="Add one from a resource's Distribution panel before the video goes up."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-[0.8125rem]">
                <thead className="border-b border-line text-[0.75rem] text-muted">
                  <tr>
                    <Th>Link</Th>
                    <Th>Resource</Th>
                    <Th align="right">Clicks</Th>
                    <Th align="right">Unlocks</Th>
                    <Th align="right">Rate</Th>
                    <Th align="right">Last click</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.campaigns.map((row) => (
                    <tr key={row.code} className="transition-colors hover:bg-canvas">
                      <Td>
                        <code className="font-medium text-ink">/r/{row.code}</code>
                        <span className="mt-0.5 block truncate text-[0.75rem] text-muted">
                          {row.platform ?? "—"}
                          {row.note ? ` · ${row.note}` : ""}
                        </span>
                      </Td>
                      <Td>
                        <span className="block truncate text-ink">{row.resourceTitle}</span>
                      </Td>
                      <Td align="right">{row.clicks.toLocaleString("en-GB")}</Td>
                      <Td align="right">{row.unlocks.toLocaleString("en-GB")}</Td>
                      <Td align="right">{rate(row.unlocks, row.clicks)}</Td>
                      <Td align="right">
                        {row.lastClickAt ? dateFormat.format(new Date(row.lastClickAt)) : "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && data.directUnlocks > 0 && (
            <p className="border-t border-line px-5 py-3 text-[0.75rem] text-muted">
              {data.directUnlocks.toLocaleString("en-GB")}{" "}
              {data.directUnlocks === 1 ? "unlock" : "unlocks"} arrived without a short link — found
              the library directly, or a browser that blocked the attribution cookie.
            </p>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="By resource"
            description="Downloads are counted per resource rather than per campaign — a redeemed grant carries no campaign, and a column that guessed would be quietly wrong."
          />
          {loading ? (
            <SkeletonRows rows={4} />
          ) : !data || data.resources.length === 0 ? (
            <EmptyState
              title="No resources yet"
              body="Create one and it will appear here as soon as it starts getting traffic."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-[0.8125rem]">
                <thead className="border-b border-line text-[0.75rem] text-muted">
                  <tr>
                    <Th>Resource</Th>
                    <Th align="right">Clicks</Th>
                    <Th align="right">Views</Th>
                    <Th align="right">Unlocks</Th>
                    <Th align="right">Downloads</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.resources.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-canvas">
                      <Td>
                        <Link
                          href={`/admin/resources/${row.id}`}
                          className="block truncate font-medium text-ink hover:text-violet"
                        >
                          {row.title}
                        </Link>
                        <span className="mt-1 flex items-center gap-2 text-[0.75rem] text-muted">
                          <StatusBadge status={row.status} />
                          {RESOURCE_GATE_LABELS[row.gate as ResourceGateName] ?? row.gate}
                        </span>
                      </Td>
                      <Td align="right">{row.clicks.toLocaleString("en-GB")}</Td>
                      <Td align="right">{row.views.toLocaleString("en-GB")}</Td>
                      <Td align="right">{row.unlocks.toLocaleString("en-GB")}</Td>
                      <Td align="right">{row.downloads.toLocaleString("en-GB")}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent unlocks"
            description="The last ten addresses, newest first."
            action={
              canReadLeads ? (
                // Not a page: this URL answers with a CSV and a
                // Content-Disposition header. `next/link` would prefetch it and
                // route it client-side, neither of which a download wants.
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a
                  href="/api/admin/resources/leads?format=csv"
                  className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-violet transition-colors hover:text-ink"
                >
                  <Link2 className="size-3.5" aria-hidden />
                  Export all as CSV
                </a>
              ) : undefined
            }
          />
          {canReadLeads === false ? (
            <p className="px-5 py-6 text-[0.8125rem] leading-relaxed text-muted">
              Your role can see how the library performs but not who unlocked what — lead addresses
              sit with the enquiry inbox.
            </p>
          ) : !leads ? (
            <SkeletonRows rows={4} />
          ) : leads.length === 0 ? (
            <EmptyState
              title="Nobody has unlocked anything yet"
              body="Once a gated resource is published and linked from a video, unlocks land here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[0.8125rem]"
                >
                  <span className="min-w-0 flex-1 basis-full truncate sm:basis-auto">
                    <span className="font-medium text-ink">{lead.email}</span>
                    {lead.name && <span className="ml-2 text-muted">{lead.name}</span>}
                  </span>
                  <span className="min-w-0 truncate text-muted">{lead.resource.title}</span>
                  <span className="text-[0.75rem] text-muted">
                    {lead.campaign ? `/r/${lead.campaign}` : "direct"}
                  </span>
                  {lead.marketingConsent && (
                    <span className="label rounded-full bg-violet-wash px-2 py-0.5 text-violet">
                      Subscribed
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[0.75rem] text-muted">
                    {dateFormat.format(new Date(lead.createdAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  caption?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <dt className="flex items-center gap-1.5 text-[0.75rem] text-muted">
        <span className="text-violet">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 text-[1.5rem] font-extrabold tracking-[-0.03em] text-ink">
        {value === undefined ? (
          <span className="inline-block h-6 w-14 animate-pulse rounded bg-canvas" />
        ) : (
          value.toLocaleString("en-GB")
        )}
      </dd>
      {caption && <p className="mt-0.5 text-[0.75rem] text-muted">{caption}</p>}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`px-5 py-2.5 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td
      className={`max-w-[16rem] px-5 py-3 ${align === "right" ? "text-right tabular-nums text-ink" : "text-left"}`}
    >
      {children}
    </td>
  );
}
