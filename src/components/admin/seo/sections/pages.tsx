"use client";

import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Panel, PanelHeader, Pagination, SearchInput, SkeletonRows, Modal } from "@/components/admin/ui";
import { NotConnected, Section, StaleNotice } from "@/components/admin/seo/ui";
import { useEndpoint, type Pagination as PaginationMeta } from "@/components/admin/seo/hooks";
import { formatNumber, formatPercent, formatPosition } from "@/lib/metrics";

/**
 * Landing pages from Search Console — which of your pages Google actually
 * shows people, and how well each one does when it is shown.
 */

type PageRow = {
  page: string;
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  positionChange: number | null;
};

type Response =
  | { connected: false; reason: string }
  | {
      connected: true;
      fetchedAt: string;
      stale: boolean;
      items: PageRow[];
      pagination: PaginationMeta;
    };

export function PagesSection({
  websiteId,
  rangeParams,
  version,
}: {
  websiteId: string;
  rangeParams: Record<string, string>;
  version: number;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PageRow | null>(null);

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/search-console/pages`,
    { ...rangeParams, v: version, q: query || undefined, page, perPage: 25 },
  );

  if (!loading && data && !data.connected) {
    return (
      <Section title="Top Pages">
        <NotConnected reason={data.reason} websiteId={websiteId} />
      </Section>
    );
  }

  const connected = data?.connected ? data : null;

  return (
    <Section title="Top Pages" description="Which pages bring people in from Google.">
      <Panel>
        <PanelHeader
          title="Landing pages"
          description={connected ? `${formatNumber(connected.pagination.total)} pages` : undefined}
          action={
            <div className="w-full sm:w-64">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Search pages…"
              />
            </div>
          }
        />

        {loading && !connected ? (
          <SkeletonRows rows={6} cols={5} />
        ) : !connected || connected.items.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.8125rem] text-muted">
            No pages received search impressions in this period.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line text-left text-[0.6875rem] uppercase tracking-wide text-muted">
                    <th scope="col" className="px-5 py-2.5 font-semibold">Page</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Clicks</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Impressions</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">CTR</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {connected.items.map((row) => (
                    <tr
                      key={row.page}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer hover:bg-canvas"
                    >
                      <td className="max-w-0 px-5 py-2.5">
                        <span className="block truncate text-ink" title={row.page}>
                          {row.path}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[0.75rem] font-semibold text-ink">
                        {formatNumber(row.clicks)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[0.75rem] text-ink-soft">
                        {formatNumber(row.impressions)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[0.75rem] text-ink-soft">
                        {formatPercent(row.ctr)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-[0.75rem] text-ink-soft">
                        {formatPosition(row.position)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={connected.pagination} onPage={setPage} />
          </>
        )}
      </Panel>

      {connected && <StaleNotice fetchedAt={connected.stale ? connected.fetchedAt : undefined} />}

      <PageDetail row={selected} onClose={() => setSelected(null)} />
    </Section>
  );
}

function PageDetail({ row, onClose }: { row: PageRow | null; onClose: () => void }) {
  return (
    <Modal
      open={row !== null}
      onClose={onClose}
      title={row?.path ?? ""}
      description="How this page performs in Google's search results."
    >
      {row && (
        <div className="px-5 py-5">
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: "Clicks", value: formatNumber(row.clicks) },
              { label: "Impressions", value: formatNumber(row.impressions) },
              { label: "Click-through rate", value: formatPercent(row.ctr) },
              { label: "Average position", value: formatPosition(row.position) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-line bg-canvas p-3">
                <dt className="text-[0.75rem] text-muted">{item.label}</dt>
                <dd className="mt-1 font-display text-lg font-bold text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-soft">
            {row.clicks === 0 && row.impressions > 0
              ? "This page shows up in Google's results but nobody has clicked it in this period. That usually means its title and description do not make clear what someone would get by visiting."
              : row.position > 10
                ? "This page ranks below the first page for most of the searches that show it. Strengthening its content and linking to it from your other pages is the usual way to move it up."
                : "This page ranks on the first page for most of the searches that show it."}
          </p>

          {row.positionChange !== null && Math.abs(row.positionChange) >= 0.5 && (
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">
              Its average position has{" "}
              {row.positionChange < 0 ? "improved" : "slipped"} by{" "}
              {Math.abs(row.positionChange).toFixed(1)} since the previous period.
            </p>
          )}

          <div className="mt-5 flex justify-between gap-2">
            <a
              href={row.page}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-canvas"
            >
              Open the page
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <X className="size-3.5" aria-hidden />
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
