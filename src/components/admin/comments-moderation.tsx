"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, ExternalLink, ShieldAlert, Trash2 } from "lucide-react";
import { api, qs, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { PageHeader } from "@/components/admin/shell";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Pagination,
  Panel,
  SearchInput,
  Select,
  SkeletonRows,
  StatusBadge,
} from "@/components/admin/ui";
import { relativeTime } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * Comment moderation.
 *
 * Comments go live the moment they are written — a queue nobody empties is a
 * comment box that quietly swallows what people say — so this screen is the
 * counterweight: everything that has been posted, newest first, with hiding one
 * click away and an email on every arrival to bring somebody here.
 *
 * Hiding is the primary action and deleting is the exception. A hidden comment
 * is off the public page at once but still readable here, which is what a
 * borderline call needs when the author writes in to ask why.
 */

type Comment = {
  id: string;
  kind: "BLOG" | "INSIGHT" | "CASE_STUDY" | "RESOURCE";
  slug: string;
  name: string;
  email: string;
  body: string;
  status: "PUBLISHED" | "HIDDEN" | "SPAM";
  createdAt: string;
};

type Listing = {
  items: Comment[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  pending: number;
};

const KIND_LABEL: Record<Comment["kind"], string> = {
  BLOG: "Blog",
  INSIGHT: "Insight",
  CASE_STUDY: "Case study",
  RESOURCE: "Resource",
};

/** Where each kind's public page actually lives. */
const KIND_BASE: Record<Comment["kind"], string> = {
  // Insights are served under /blog too — see `article-editor.tsx`.
  BLOG: "/blog",
  INSIGHT: "/blog",
  CASE_STUDY: "/case-studies",
  RESOURCE: "/resources",
};

function publicHref(comment: Comment) {
  return `${KIND_BASE[comment.kind]}/${comment.slug}#comments`;
}

export function CommentsModeration() {
  const toast = useToast();

  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get<Listing>(`/api/admin/comments${qs({ q, status, kind, page, perPage: 20 })}`));
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not load comments.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, status, kind, page, toast]);

  useEffect(() => {
    // `load` is async: its setState calls run in a promise continuation, not
    // synchronously in the effect body. Same reasoning as the messages inbox.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const moderate = async (comment: Comment, next: Comment["status"]) => {
    setBusy(comment.id);
    try {
      await api.patch(`/api/admin/comments/${comment.id}`, { status: next });
      toast(next === "PUBLISHED" ? "Back on the page." : "Hidden from the page.", "success");
      await load();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "That did not work.", "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (comment: Comment) => {
    setBusy(comment.id);
    try {
      await api.del(`/api/admin/comments/${comment.id}`);
      toast("Deleted.", "success");
      await load();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not delete it.", "error");
    } finally {
      setBusy(null);
      setDeleting(null);
    }
  };

  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Comments"
        description={
          data
            ? `${data.pending} live on the site.`
            : "Everything readers have written on your articles and case studies."
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <SearchInput value={q} onChange={change(setQ)} placeholder="Name, email, comment or slug" />
          <Select
            value={status}
            onChange={(e) => change(setStatus)(e.target.value)}
            aria-label="Status"
            className="w-36"
          >
            <option value="all">All</option>
            <option value="PUBLISHED">Live</option>
            <option value="HIDDEN">Hidden</option>
            <option value="SPAM">Spam</option>
          </Select>
          <Select
            value={kind}
            onChange={(e) => change(setKind)(e.target.value)}
            aria-label="Content type"
            className="w-40"
          >
            <option value="all">Everything</option>
            <option value="BLOG">Blogs</option>
            <option value="INSIGHT">Insights</option>
            <option value="CASE_STUDY">Case studies</option>
            <option value="RESOURCE">Resources</option>
          </Select>
        </div>

        {loading && !data ? (
          <SkeletonRows rows={5} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No comments yet"
            body="When somebody comments on an article or a case study, it lands here and you get an email."
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.items.map((comment) => (
                <li
                  key={comment.id}
                  className={cn("p-4", comment.status !== "PUBLISHED" && "bg-canvas/60")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.875rem] font-semibold text-ink">{comment.name}</span>
                        <StatusBadge status={comment.status} />
                        <span className="text-[0.75rem] text-muted">
                          {relativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.75rem] text-muted">
                        <a
                          href={`mailto:${comment.email}`}
                          className="text-violet-deep hover:underline"
                        >
                          {comment.email}
                        </a>
                        {" · "}
                        {KIND_LABEL[comment.kind]}
                        {" · "}
                        <a
                          href={publicHref(comment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-ink"
                        >
                          {comment.slug}
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {comment.status === "PUBLISHED" ? (
                        <Button
                          size="sm"
                          loading={busy === comment.id}
                          onClick={() => moderate(comment, "HIDDEN")}
                          icon={<EyeOff className="size-3.5" aria-hidden />}
                        >
                          Hide
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          loading={busy === comment.id}
                          onClick={() => moderate(comment, "PUBLISHED")}
                          icon={<Eye className="size-3.5" aria-hidden />}
                        >
                          Restore
                        </Button>
                      )}
                      {comment.status !== "SPAM" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy === comment.id}
                          onClick={() => moderate(comment, "SPAM")}
                          icon={<ShieldAlert className="size-3.5" aria-hidden />}
                          aria-label="Mark as spam"
                        />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(comment)}
                        icon={<Trash2 className="size-3.5" aria-hidden />}
                        aria-label="Delete permanently"
                      />
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-soft">
                    {comment.body}
                  </p>
                </li>
              ))}
            </ul>

            <Pagination meta={data.pagination} onPage={setPage} />
          </>
        )}
      </Panel>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        title="Delete this comment?"
        body="It is removed for good, and the count on the page drops by one. Hiding it instead keeps it readable here."
        confirmLabel="Delete"
        loading={busy !== null}
      />
    </>
  );
}
