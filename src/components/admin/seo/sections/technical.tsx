"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ScanSearch } from "lucide-react";
import { Panel, PanelHeader, SkeletonRows } from "@/components/admin/ui";
import { Section } from "@/components/admin/seo/ui";
import { SEVERITY_COLOR, SEVERITY_TONE } from "@/components/admin/seo/palette";
import { useEndpoint } from "@/components/admin/seo/hooks";
import { relativeTime } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { IssueSeverity } from "@/generated/prisma";

/**
 * Technical SEO, grouped by severity.
 *
 * Every issue carries the same four things, in the client's language: what
 * happened, why it matters, what to do, and how urgent it is. The wording comes
 * from the catalogue in `config/seo-issues.ts`, never from this component — so
 * a raw code like CANONICAL_MISMATCH can never reach the screen.
 */

type IssueGroup = {
  code: string;
  title: string;
  severity: IssueSeverity;
  count: number;
  what: string;
  why: string;
  fix: string;
  urls: { url: string; detail: string | null; firstSeenAt: string }[];
};

type Response = {
  lastCrawl: {
    startedAt: string;
    finishedAt: string | null;
    status: string;
    pagesCrawled: number;
    error: string | null;
  } | null;
  counts: Record<IssueSeverity, number>;
  groups: IssueGroup[];
  recentlyResolved: { code: string; title: string; url: string; resolvedAt: string }[];
  severityLabels: Record<IssueSeverity, string>;
  severityBlurb: Record<IssueSeverity, string>;
};

const ORDER: IssueSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function TechnicalSection({
  websiteId,
  version,
}: {
  websiteId: string;
  version: number;
}) {
  const [severity, setSeverity] = useState<IssueSeverity | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/seo/technical`,
    { v: version },
  );

  if (loading && !data) {
    return (
      <Section title="Technical SEO">
        <Panel>
          <SkeletonRows rows={4} cols={3} />
        </Panel>
      </Section>
    );
  }

  if (!data) return null;

  if (!data.lastCrawl) {
    return (
      <Section title="Technical SEO" description="Problems on the website itself.">
        <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-violet-wash text-violet">
            <ScanSearch className="size-5" aria-hidden />
          </span>
          <p className="max-w-md text-[0.8125rem] leading-relaxed text-ink-soft">
            No technical audit has run yet. An audit visits your pages and checks them for the
            problems that quietly cost search traffic — missing titles, broken links, pages Google
            has been told to ignore.
          </p>
          <a
            href={`/admin/seo/${websiteId}/integrations`}
            className="rounded-lg bg-ink px-4 py-2 text-[0.8125rem] font-medium text-white transition-colors hover:bg-violet"
          >
            Run the first audit
          </a>
        </Panel>
      </Section>
    );
  }

  const total = ORDER.reduce((sum, key) => sum + data.counts[key], 0);
  const groups = severity === "all" ? data.groups : data.groups.filter((g) => g.severity === severity);

  return (
    <Section
      title="Technical SEO"
      description="Problems found on the website itself, most urgent first."
    >
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSeverity(severity === key ? "all" : key)}
            aria-pressed={severity === key}
            className={cn(
              "rounded-xl border bg-surface p-4 text-left transition-colors",
              severity === key ? "border-ink" : "border-line hover:border-ink/25",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: SEVERITY_COLOR[key] }}
              />
              <span className="text-[0.8125rem] font-medium text-ink-soft">
                {data.severityLabels[key]}
              </span>
            </span>
            <span className="mt-2 block font-display text-2xl font-extrabold tracking-[-0.03em] text-ink">
              {data.counts[key]}
            </span>
            <span className="mt-1 block text-[0.6875rem] leading-relaxed text-muted">
              {data.severityBlurb[key]}
            </span>
          </button>
        ))}
      </div>

      <Panel className="mt-3">
        <PanelHeader
          title="What was found"
          description={
            data.lastCrawl.status === "FAILED"
              ? `The last audit failed${data.lastCrawl.error ? `: ${data.lastCrawl.error}` : "."}`
              : `${data.lastCrawl.pagesCrawled} pages checked ${relativeTime(data.lastCrawl.startedAt)}`
          }
          action={
            severity !== "all" ? (
              <button
                type="button"
                onClick={() => setSeverity("all")}
                className="text-[0.75rem] font-medium text-violet hover:underline"
              >
                Show all severities
              </button>
            ) : undefined
          }
        />

        {total === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <CheckCircle2 className="size-6 text-emerald-600" aria-hidden />
            <p className="text-[0.875rem] font-medium text-ink">Nothing needs fixing</p>
            <p className="max-w-sm text-[0.8125rem] leading-relaxed text-muted">
              The last audit checked {data.lastCrawl.pagesCrawled} pages and found no issues.
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.8125rem] text-muted">
            Nothing at this severity.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {groups.map((group) => (
              <li key={group.code}>
                <button
                  type="button"
                  onClick={() => setOpen(open === group.code ? null : group.code)}
                  aria-expanded={open === group.code}
                  className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-canvas"
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide",
                      SEVERITY_TONE[group.severity],
                    )}
                  >
                    {data.severityLabels[group.severity]}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.875rem] font-medium text-ink">
                      {group.title}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted">
                      {group.what}
                    </span>
                  </span>

                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-muted transition-transform",
                      open === group.code && "rotate-180",
                    )}
                  />
                </button>

                {open === group.code && (
                  <div className="border-t border-line bg-canvas px-5 py-4">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-[0.75rem] font-semibold text-ink">Why it matters</dt>
                        <dd className="mt-0.5 max-w-3xl text-[0.8125rem] leading-relaxed text-ink-soft">
                          {group.why}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[0.75rem] font-semibold text-ink">What to do</dt>
                        <dd className="mt-0.5 max-w-3xl text-[0.8125rem] leading-relaxed text-ink-soft">
                          {group.fix}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-4 mb-1.5 text-[0.75rem] font-semibold text-ink">
                      Affected pages
                      {group.count > group.urls.length && (
                        <span className="ml-1 font-normal text-muted">
                          (showing {group.urls.length} of {group.count})
                        </span>
                      )}
                    </p>

                    <ul className="space-y-1">
                      {group.urls.map((item) => (
                        <li key={item.url} className="flex flex-wrap items-baseline gap-x-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="min-w-0 max-w-full truncate font-mono text-[0.75rem] text-violet hover:underline"
                          >
                            {shortenUrl(item.url)}
                          </a>
                          {item.detail && (
                            <span className="text-[0.6875rem] text-muted">{item.detail}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {data.recentlyResolved.length > 0 && (
        <Panel className="mt-3">
          <PanelHeader
            title="Recently fixed"
            description="Issues that were present and are no longer found"
          />
          <ul className="divide-y divide-line">
            {data.recentlyResolved.map((item) => (
              <li key={`${item.code}-${item.url}`} className="flex items-center gap-3 px-5 py-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink-soft">
                  {item.title}
                  <span className="ml-2 font-mono text-[0.75rem] text-muted">
                    {shortenUrl(item.url)}
                  </span>
                </span>
                <span className="shrink-0 text-[0.75rem] text-muted">
                  {relativeTime(item.resolvedAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Section>
  );
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || "/";
  } catch {
    return url;
  }
}
