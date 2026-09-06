"use client";

import { Eye, Heart, MessageCircle } from "lucide-react";
import { useEngagement, useRecordView } from "@/components/engagement/provider";
import { formatCompact } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { ContentKind } from "@/lib/engagement";

/**
 * Views, likes and comments for one piece of content.
 *
 * Views are read-only — they are a record of what happened, not a control.
 * Likes are the only thing here anybody can press, and they are pressable from
 * a listing card as well as from the article itself, so agreeing with something
 * never costs a page load.
 *
 * Nothing renders until the counts arrive. A skeleton that becomes "0 likes" is
 * honest; a hard-coded 0 that becomes 47 reads as a bug.
 */

function Count({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: typeof Eye;
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={`${value} ${label}`}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="tabular-nums">{formatCompact(value)}</span>
      <span className="sr-only"> {label}</span>
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-24 animate-pulse rounded-full bg-canvas-2", className)}
    />
  );
}

export function LikeButton({
  kind,
  slug,
  size = "sm",
}: {
  kind: ContentKind;
  slug: string;
  size?: "sm" | "lg";
}) {
  const { counts, ready, toggleLike } = useEngagement(kind, slug);

  return (
    <button
      type="button"
      onClick={(event) => {
        // On a card the whole surface is a stretched link to the article. This
        // button sits on top of it, so the press must not also navigate.
        event.preventDefault();
        event.stopPropagation();
        toggleLike();
      }}
      disabled={!ready}
      aria-pressed={counts.liked}
      aria-label={counts.liked ? "Remove your like" : "Like this"}
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center gap-2 rounded-full border font-medium transition-all duration-300",
        "disabled:cursor-default disabled:opacity-60",
        size === "lg" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
        counts.liked
          ? "border-violet/30 bg-violet-wash text-violet-deep"
          : "border-line bg-surface text-muted hover:border-violet/30 hover:text-violet-deep",
      )}
    >
      <Heart
        className={cn(
          size === "lg" ? "size-4" : "size-3.5",
          "shrink-0 transition-transform duration-300",
          counts.liked && "scale-110 fill-current",
        )}
        aria-hidden
      />
      <span className="tabular-nums">{ready ? formatCompact(counts.likes) : "—"}</span>
    </button>
  );
}

/** The compact row for a listing card: views and comments, then the like button. */
export function CardEngagement({ kind, slug }: { kind: ContentKind; slug: string }) {
  const { counts, ready } = useEngagement(kind, slug);

  if (!ready) return <Skeleton />;

  return (
    <span className="flex w-full items-center justify-between gap-3 text-xs text-muted">
      <span className="flex items-center gap-4">
        <Count icon={Eye} value={counts.views} label="views" />
        <Count icon={MessageCircle} value={counts.comments} label="comments" />
      </span>
      <LikeButton kind={kind} slug={slug} />
    </span>
  );
}

/**
 * The article's own row, under the byline.
 *
 * This is also where the view is recorded — the beacon fires from the component
 * that displays the number, so the two can never be wired up separately.
 */
export function ArticleEngagement({
  kind,
  slug,
  commentsHref = "#comments",
  className,
}: {
  kind: ContentKind;
  slug: string;
  commentsHref?: string;
  className?: string;
}) {
  const { counts, ready } = useEngagement(kind, slug);
  useRecordView(kind, slug);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>
      {ready ? (
        <>
          <Count icon={Eye} value={counts.views} label="views" className="text-sm text-muted" />
          <a
            href={commentsHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-violet-deep"
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">{formatCompact(counts.comments)}</span>
            <span className="sr-only"> comments</span>
          </a>
        </>
      ) : (
        <Skeleton className="h-5 w-28" />
      )}

      <LikeButton kind={kind} slug={slug} size="lg" />
    </div>
  );
}
