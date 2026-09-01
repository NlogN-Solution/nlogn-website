"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { api, qs, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Panel,
  Pagination,
  SearchInput,
  Select,
  SkeletonRows,
  StatusBadge,
  type PaginationMeta,
} from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/shell";

/**
 * The content index, shared by blogs, insights and case studies.
 *
 * Filtering and paging are server-side: the table asks for one page at a time
 * so the list stays fast whether there are twelve items or twelve thousand.
 */

type Row = {
  id: string;
  slug: string;
  status: string;
  featured: boolean;
  updatedAt: string;
  title?: string;
  projectName?: string;
  clientName?: string;
  category?: { name: string } | null;
};

type Listing = { items: Row[]; pagination: PaginationMeta };

export function ContentList({
  kind,
  title,
  description,
  publicPath,
  staticCount,
}: {
  kind: "blogs" | "insights" | "case-studies";
  title: string;
  description: string;
  publicPath: string;
  staticCount: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  // No synchronous `setLoading(true)` here: the first render already starts in
  // the loading state, and a refetch keeps the current rows visible rather than
  // flashing a skeleton on every keystroke.
  const load = useCallback(async () => {
    try {
      const result = await api.get<Listing>(
        `/api/admin/${kind}${qs({ q, status, sort, page, perPage: 20 })}`,
      );
      setData(result);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not load the list.", "error");
    } finally {
      setLoading(false);
    }
  }, [kind, q, status, sort, page, toast]);

  useEffect(() => {
  // `load` is async: every setState in it runs in a promise continuation, not
  // synchronously in the effect body. The rule cannot see across the await, and
  // fetching on mount is exactly what this effect is for.
  // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // A new filter starts at page one, not page four of the old results. Done in
  // the setters rather than an effect, so there is one render instead of two.
  const changeQ = (value: string) => {
    setQ(value);
    setPage(1);
  };
  const changeStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };
  const changeSort = (value: string) => {
    setSort(value);
    setPage(1);
  };

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.del(`/api/admin/${kind}/${pendingDelete.id}`);
      toast("Deleted.", "success");
      setPendingDelete(null);
      load();
      router.refresh();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not delete that.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const label = (row: Row) => row.title ?? row.projectName ?? row.slug;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={() => router.push(`/admin/${kind}/new`)}
          >
            New
          </Button>
        }
      />

      {staticCount > 0 && (
        <p className="mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-[0.8125rem] leading-relaxed text-muted">
          {staticCount} {staticCount === 1 ? "item is" : "items are"} published from the repository
          and {staticCount === 1 ? "does" : "do"} not appear here. {staticCount === 1 ? "It" : "They"}{" "}
          still {staticCount === 1 ? "renders" : "render"} on the website — anything created below
          is listed alongside {staticCount === 1 ? "it" : "them"}.
        </p>
      )}

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <SearchInput value={q} onChange={changeQ} placeholder={`Search ${title.toLowerCase()}…`} />
          <Select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            aria-label="Filter by status"
            className="w-36"
          >
            <option value="all">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select
            value={sort}
            onChange={(e) => changeSort(e.target.value)}
            aria-label="Sort"
            className="w-36"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Recently edited</option>
            <option value="title">A–Z</option>
          </Select>
        </div>

        {loading && !data ? (
          <SkeletonRows rows={6} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title={q || status !== "all" ? "Nothing matches those filters" : `No ${title.toLowerCase()} yet`}
            body={
              q || status !== "all"
                ? "Try a different search or clear the status filter."
                : "Create the first one — it will appear on the website as soon as you publish it."
            }
            action={
              <Button variant="primary" onClick={() => router.push(`/admin/${kind}/new`)}>
                Create one
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: a table. Mobile: the same rows, stacked. */}
            <ul className="divide-y divide-line">
              {data.items.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-canvas"
                >
                  <Link
                    href={`/admin/${kind}/${row.id}`}
                    className="min-w-0 flex-1 basis-full sm:basis-auto"
                  >
                    <span className="block truncate text-[0.875rem] font-medium text-ink">
                      {label(row)}
                    </span>
                    <span className="block truncate text-[0.75rem] text-muted">
                      /{row.slug}
                      {row.clientName ? ` · ${row.clientName}` : ""}
                      {row.category ? ` · ${row.category.name}` : ""}
                    </span>
                  </Link>

                  <StatusBadge status={row.status} />

                  <span className="hidden w-28 shrink-0 text-right text-[0.75rem] text-muted md:block">
                    {new Date(row.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
                    {row.status === "PUBLISHED" && (
                      <a
                        href={`${publicPath}/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${label(row)} on the website`}
                        className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(row)}
                      aria-label={`Delete ${label(row)}`}
                      className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination meta={data.pagination} onPage={setPage} />
          </>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this permanently?"
        body={
          <>
            <strong className="font-semibold text-ink">
              {pendingDelete ? label(pendingDelete) : ""}
            </strong>{" "}
            will be removed and, if it is published, will disappear from the website immediately.
            This cannot be undone.
          </>
        }
      />
    </>
  );
}
