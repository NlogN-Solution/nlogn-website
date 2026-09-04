"use client";

import { useCallback, useState } from "react";
<<<<<<< Updated upstream
import { useRouter } from "next/navigation";
=======
>>>>>>> Stashed changes
import Link from "next/link";
import { ExternalLink, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { Select } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { api, ApiError } from "@/components/admin/api";
import { RangePicker, rangeToParams, type RangeValue } from "@/components/admin/seo/range-picker";
import { OverviewSection } from "@/components/admin/seo/sections/overview";
import { TrafficSection } from "@/components/admin/seo/sections/traffic";
import { SearchSection } from "@/components/admin/seo/sections/search";
import { KeywordsSection } from "@/components/admin/seo/sections/keywords";
import { PagesSection } from "@/components/admin/seo/sections/pages";
import { OpportunitiesSection } from "@/components/admin/seo/sections/opportunities";
import { TechnicalSection } from "@/components/admin/seo/sections/technical";
import { BacklinksSection } from "@/components/admin/seo/sections/backlinks";
import { PerformanceSection } from "@/components/admin/seo/sections/performance";
import { DEFAULT_RANGE } from "@/lib/date-range";

/**
 * The dashboard.
 *
 * Sections are ordered as a client would read them: what happened, where the
 * traffic came from, how Google sees the site, what to do next, and only then
 * the technical detail. Each fetches independently, so a slow provider costs
 * one panel rather than the page.
 *
 * `version` is bumped on refresh and threaded into every section's query key —
 * that is what makes one button re-fetch nine panels without a shared store.
 */

export type DashboardWebsite = {
  id: string;
  name: string;
  domain: string;
  gscSiteUrl: string | null;
  ga4PropertyId: string | null;
};

export function SeoDashboard({
  website,
  websites,
  canWrite,
}: {
  website: DashboardWebsite;
  websites: { id: string; name: string; domain: string }[];
  canWrite: boolean;
}) {
<<<<<<< Updated upstream
  const router = useRouter();
=======
>>>>>>> Stashed changes
  const [range, setRange] = useState<RangeValue>({ preset: DEFAULT_RANGE });
  const [version, setVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const rangeParams = rangeToParams(range);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-reads every panel against the providers rather than the cache. The
      // heavier "Sync now" — which crawls and runs Lighthouse — lives on the
      // integrations page, where its cost is explained.
      setVersion((current) => current + 1);
      toast("Refreshing every panel…");
    } finally {
      // The sections own their own loading states from here.
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [toast]);

  return (
    <>
      <PageHeader
        title="SEO & Performance"
        description={`How ${website.domain} is performing in search, and why.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {websites.length > 1 && (
              <Select
                value={website.id}
<<<<<<< Updated upstream
                onChange={(event) => router.push(`/admin/seo/${event.target.value}`)}
=======
                onChange={(event) => {
                  window.location.href = `/admin/seo/${event.target.value}`;
                }}
>>>>>>> Stashed changes
                aria-label="Choose a website"
                className="h-9 w-auto min-w-[10rem]"
              >
                {websites.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            )}

            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-canvas"
            >
              Visit
              <ExternalLink className="size-3.5" aria-hidden />
            </a>

            {canWrite && (
              <Link
                href={`/admin/seo/${website.id}/integrations`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-canvas"
              >
                <Settings2 className="size-3.5" aria-hidden />
                Integrations
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-5">
        <RangePicker value={range} onChange={setRange} onRefresh={refresh} refreshing={refreshing} />
      </div>

      <OverviewSection websiteId={website.id} rangeParams={rangeParams} version={version} />
      <TrafficSection websiteId={website.id} rangeParams={rangeParams} version={version} />
      <SearchSection websiteId={website.id} rangeParams={rangeParams} version={version} />
      <KeywordsSection websiteId={website.id} rangeParams={rangeParams} version={version} />
      <PagesSection websiteId={website.id} rangeParams={rangeParams} version={version} />
      <OpportunitiesSection websiteId={website.id} rangeParams={rangeParams} version={version} />
      <TechnicalSection websiteId={website.id} version={version} />
      <BacklinksSection websiteId={website.id} version={version} />
      <PerformanceSection websiteId={website.id} version={version} />
    </>
  );
}

/** Shared by the integrations page's "Sync now" buttons. */
export async function runSync(
  websiteId: string,
  provider: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await api.post<{ results: { ok: boolean; detail: string; provider: string }[] }>(
      `/api/admin/websites/${websiteId}/integrations/${provider}/sync`,
    );

    const failed = result.results.filter((item) => !item.ok);

    return {
      ok: failed.length === 0,
      message:
        failed.length === 0
          ? result.results.map((item) => item.detail).join(" ")
          : failed.map((item) => item.detail).join(" "),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof ApiError ? error.message : "The sync could not be started.",
    };
  }
}
