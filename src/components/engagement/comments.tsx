"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { useEngagement } from "@/components/engagement/provider";
import { VISITOR_HEADER, visitorId, type ContentKind } from "@/lib/engagement";
import { relativeTime } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * The comment thread, and the form that adds to it.
 *
 * A name and an email address are required; only the name is ever shown. The
 * address exists so there is a person behind the comment and so it can be
 * answered — it is never returned by the API, so it cannot leak through the
 * thread even by accident.
 *
 * Comments appear the moment they are posted. That is the right trade for a
 * site this size — a queue nobody empties is a comment box that silently eats
 * what people write — and the owner is emailed on every one, with a moderation
 * screen a click away.
 */

type Comment = { id: string; name: string; body: string; createdAt: string };

type FormState = "idle" | "sending" | "sent";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Comments({ kind, slug }: { kind: ContentKind; slug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [state, setState] = useState<FormState>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { noteComment } = useEngagement(kind, slug);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/engagement/comments?kind=${kind}&slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setComments(payload?.success ? payload.data.comments : []))
      .catch(() => undefined);

    return () => controller.abort();
  }, [kind, slug]);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setState("sending");
      setError(null);
      setFieldErrors({});

      try {
        const id = visitorId();
        const response = await fetch("/api/engagement/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(id ? { [VISITOR_HEADER]: id } : {}),
          },
          body: JSON.stringify({ kind, slug, name, email, body }),
        });
        const payload = await response.json();

        if (!payload?.success) {
          setFieldErrors(payload?.error?.fields ?? {});
          setError(payload?.error?.message ?? "That did not go through. Please try again.");
          setState("idle");
          return;
        }

        setComments((previous) => [...(previous ?? []), payload.data.comment]);
        noteComment();
        setName("");
        setEmail("");
        setBody("");
        setState("sent");
      } catch {
        setError("That did not go through. Check your connection and try again.");
        setState("idle");
      }
    },
    [kind, slug, name, email, body, noteComment],
  );

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-violet/50";

  return (
    <section id="comments" className="scroll-mt-28">
      <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
        {comments && comments.length > 0
          ? `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`
          : "Comments"}
      </h2>

      {/* The thread first, the form under it: somebody arriving from the
          article's comment count came to read, not to write. */}
      {comments === null ? (
        <ul className="mt-8 space-y-4" aria-hidden>
          {[0, 1].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-[22px] bg-canvas-2" />
          ))}
        </ul>
      ) : comments.length === 0 ? (
        <p className="mt-5 flex items-center gap-2.5 text-[0.9375rem] text-muted">
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          Nothing here yet — be the first to say something.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-[22px] border border-line bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-wash font-display text-xs font-bold text-violet-deep">
                  {initials(comment.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{comment.name}</p>
                  <time dateTime={comment.createdAt} className="text-xs text-muted">
                    {relativeTime(comment.createdAt)}
                  </time>
                </div>
              </div>
              {/* Stored and rendered as plain text — `whitespace-pre-wrap` keeps
                  the paragraphs somebody typed without letting markup in. */}
              <p className="mt-4 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-soft">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 rounded-[26px] border border-line bg-canvas p-7 md:p-9">
        {state === "sent" ? (
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-violet" aria-hidden />
            <div>
              <p className="font-display text-lg font-bold text-ink">
                Thank you for your comment — it is truly appreciated.
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                It is on the page now. We read every one, and we will reply by email if it needs
                an answer.
              </p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="mt-4 text-sm font-medium text-violet-deep underline underline-offset-4 transition-colors hover:text-violet"
              >
                Write another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3 className="font-display text-lg font-bold text-ink">Leave a comment</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              Your name appears with your comment. Your email address does not — it is only so we
              can reply.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="comment-name" className="mb-1.5 block text-sm font-medium text-ink">
                  Full name
                </label>
                <input
                  id="comment-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Kabin Shrestha"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={cn(inputClass, fieldErrors.name && "border-red-300")}
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div className="min-w-0">
                <label htmlFor="comment-email" className="mb-1.5 block text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="comment-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={cn(inputClass, fieldErrors.email && "border-red-300")}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="comment-body" className="mb-1.5 block text-sm font-medium text-ink">
                Comment
              </label>
              <textarea
                id="comment-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                maxLength={2000}
                placeholder="What did this change for you?"
                aria-invalid={Boolean(fieldErrors.body)}
                className={cn(inputClass, "resize-y", fieldErrors.body && "border-red-300")}
              />
              <div className="mt-1.5 flex items-center justify-between gap-3">
                {fieldErrors.body ? (
                  <p className="text-xs text-red-600">{fieldErrors.body}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs tabular-nums text-muted">{body.length}/2000</span>
              </div>
            </div>

            {error && !Object.keys(fieldErrors).length && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-violet-deep disabled:opacity-60"
            >
              <Send className="size-4" aria-hidden />
              {state === "sending" ? "Posting…" : "Post comment"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
