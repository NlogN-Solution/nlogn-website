"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Panel, PanelHeader, Pagination, SearchInput, Select, SkeletonRows } from "@/components/admin/ui";
import { DataNote, DerivedBadge, NotConnected, Section, StaleNotice } from "@/components/admin/seo/ui";
import { useEndpoint, type Pagination as PaginationMeta } from "@/components/admin/seo/hooks";
import { formatNumber, formatPercent, formatPosition } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * The keyword table.
 *
 * The position-band filters are the point of this screen: "21–50" and "Top 20"
 * are how somebody finds the searches worth working on next, and neither is
 * something Search Console's own interface makes easy.
 */

type KeywordRow = {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  positionChange: number | null;
  previousPosition: number | null;
};

type Response =
  | { connected: false; reason: string }
  | {
      connected: true;
      fetchedAt: string;
      stale: boolean;
      truncated: boolean;
      totalKeywords: number;
      items: KeywordRow[];
      pagination: PaginationMeta;
    };

const BANDS = [
  { value: "all", label: "All positions" },
  { value: "top3", label: "Top 3" },
  { value: "top10", label: "Top 10" },
  { value: "top20", label: "Top 20" },
  { value: "21-50", label: "21–50" },
  { value: "51-100", label: "51–100" },
] as const;

const SORTS = [
  { value: "clicks", label: "Most clicks" },
  { value: "impressions", label: "Most impressions" },
  { value: "ctr", label: "Highest CTR" },
  { value: "position", label: "Best position" },
  { value: "change", label: "Biggest movement" },
] as const;

type Sort = (typeof SORTS)[number]["value"];

export function KeywordsSection({
  websiteId,
  rangeParams,
  version,
}: {
  websiteId: string;
  rangeParams: Record<string, string>;
  version: number;
}) {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<string>("all");
  const [minClicks, setMinClicks] = useState("");
  const [minImpressions, setMinImpressions] = useState("");
  const [sort, setSort] = useState<Sort>("clicks");
  const [page, setPage] = useState(1);

  // "Best position" means position 1 first, so ascending; every other sort
  // wants the largest number first.
  const direction = sort === "position" ? "asc" : "desc";

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/search-console/queries`,
    {
      ...rangeParams,
      v: version,
      q: query || undefined,
      band,
      sort,
      direction,
      minClicks: minClicks || undefined,
      minImpressions: minImpressions || undefined,
      page,
      perPage: 25,
    },
  );

  const reset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  if (!loading && data && !data.connected) {
    return (
      <Section title="Top Keywords">
        <NotConnected reason={data.reason} websiteId={websiteId} />
      </Section>
    );
  }

  const connected = data?.connected ? data : null;

  return (
    <Section
      title="Top Keywords"
      description="The searches that showed your website in Google's results."
    >
      <Panel>
        <PanelHeader
          title="Search queries"
          description={
            connected
              ? `${formatNumber(connected.pagination.total)} of ${formatNumber(connected.totalKeywords)} keywords match your filters`
              : undefined
          }
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <SearchInput value={query} onChange={reset(setQuery)} placeholder="Search keywords…" />

          <Select
            value={band}
            onChange={(event) => reset(setBand)(event.target.value)}
            aria-label="Position range"
            className="h-9 w-auto min-w-[9rem]"
          >
            {BANDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(event) => reset(setSort)(event.target.value as Sort)}
            aria-label="Sort by"
            className="h-9 w-auto min-w-[9rem]"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <input
            type="number"
            min={0}
            value={minClicks}
            onChange={(event) => reset(setMinClicks)(event.target.value)}
            placeholder="Min clicks"
            aria-label="Minimum clicks"
            className="h-9 w-28 rounded-lg border border-line bg-surface px-3 text-[0.8125rem] text-ink outline-none placeholder:text-muted focus:border-violet/60"
          />

          <input
            type="number"
            min={0}
            value={minImpressions}
            onChange={(event) => reset(setMinImpressions)(event.target.value)}
            placeholder="Min impressions"
            aria-label="Minimum impressions"
            className="h-9 w-36 rounded-lg border border-line bg-surface px-3 text-[0.8125rem] text-ink outline-none placeholder:text-muted focus:border-violet/60"
          />
        </div>

        {loading && !connected ? (
          <SkeletonRows rows={8} cols={5} />
        ) : !connected || connected.items.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.8125rem] text-muted">
            No keywords match these filters. Try widening the position range.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line text-left text-[0.6875rem] uppercase tracking-wide text-muted">
                    <th scope="col" className="px-5 py-2.5 font-semibold">Keyword</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Clicks</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Impressions</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">CTR</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Position</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                      Change
                      <DerivedBadge title="Search Console does not publish a position-change metric. This compares the average position in this period with the period before it." />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {connected.items.map((row) => (
                    <tr key={row.keyword} className="hover:bg-canvas">
                      <td className="max-w-0 px-5 py-2.5">
                        <span className="block truncate text-ink" title={row.keyword}>
                          {row.keyword}
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
                      <td className="px-3 py-2.5 text-right font-mono text-[0.75rem] text-ink-soft">
                        {formatPosition(row.position)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <PositionChange change={row.positionChange} />
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

      {connected && (
        <>
          <StaleNotice
            fetchedAt={connected.stale ? connected.fetchedAt : undefined}
          />
          <DataNote>
            Google anonymises rare searches and returns at most a thousand keywords per request, so
            this is a large sample rather than every search that found your site. Adding up the
            clicks here will come to less than your total clicks for the same reason.
            {connected.truncated && " This period reached that thousand-keyword limit."}
          </DataNote>
        </>
      )}
    </Section>
  );
}

/**
 * A rank moving from 12 to 8 is `-4` and is an improvement, so the arrow points
 * up and is painted green. The raw sign would say the opposite.
 */
function PositionChange({ change }: { change: number | null }) {
  if (change === null) {
    return <span className="text-[0.75rem] text-muted" title="Not ranking in the previous period">New</span>;
  }

  if (Math.abs(change) < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.75rem] text-muted">
        <Minus className="size-3" aria-hidden />
      </span>
    );
  }

  const improved = change < 0;
  const Arrow = improved ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[0.75rem] font-medium",
        improved ? "text-emerald-700" : "text-red-700",
      )}
      title={improved ? "Moved up the results" : "Moved down the results"}
    >
      <Arrow className="size-3" aria-hidden />
      {Math.abs(change).toFixed(1)}
    </span>
  );
}
