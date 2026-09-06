"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  VISITOR_HEADER,
  ZERO_COUNTS,
  engagementKey,
  visitorId,
  type ContentKind,
  type EngagementCounts,
} from "@/lib/engagement";

/**
 * Counts for everything on one page, fetched once.
 *
 * The pages themselves are cached by ISR, so these numbers cannot be rendered
 * into them — a like count baked in for sixty seconds looks broken the moment
 * somebody presses the button. They arrive after hydration instead, in a single
 * request for every card on the page rather than one request per card.
 *
 * Until that lands, the components render their own placeholder rather than a
 * zero: "0 views" and "not loaded yet" are different things, and only one of
 * them should be shown as a fact.
 */

type Ctx = {
  counts: Record<string, EngagementCounts>;
  ready: boolean;
  toggleLike: (kind: ContentKind, slug: string) => void;
  /** Called by the comment form so the count moves without a re-fetch. */
  noteComment: (kind: ContentKind, slug: string) => void;
};

const EngagementContext = createContext<Ctx | null>(null);

/** Sends the visitor id with every engagement call. See `lib/engagement.ts`. */
function headers(): HeadersInit {
  const id = visitorId();
  return id
    ? { "Content-Type": "application/json", [VISITOR_HEADER]: id }
    : { "Content-Type": "application/json" };
}

export function EngagementProvider({
  keys,
  children,
}: {
  /** Every `KIND:slug` on this page. Stable across renders — see below. */
  keys: string[];
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<Record<string, EngagementCounts>>({});
  const [ready, setReady] = useState(false);

  // Joined, so a fresh array with identical contents does not re-run the fetch.
  // The listing pages rebuild this array on every render.
  const keyList = keys.join(",");

  // A like fired before the initial load must not be overwritten by it.
  const pending = useRef<Record<string, EngagementCounts>>({});

  useEffect(() => {
    // Nothing to ask about: `ready` stays false, and every consumer renders
    // without its counters, which is the correct output for an empty page.
    if (!keyList) return;

    const controller = new AbortController();

    fetch(`/api/engagement?keys=${encodeURIComponent(keyList)}`, {
      headers: headers(),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.success) return;
        setCounts({ ...payload.data, ...pending.current });
        setReady(true);
      })
      .catch(() => {
        // Offline, blocked, or the endpoint is down. The article still reads;
        // the counters simply never appear.
        if (!controller.signal.aborted) setReady(false);
      });

    return () => controller.abort();
  }, [keyList]);

  const toggleLike = useCallback((kind: ContentKind, slug: string) => {
    const key = engagementKey(kind, slug);

    // Optimistic: the button has to answer the press immediately, and the
    // server's own count replaces this the moment it arrives.
    setCounts((previous) => {
      const current = previous[key] ?? ZERO_COUNTS;
      const next = {
        ...current,
        liked: !current.liked,
        likes: Math.max(0, current.likes + (current.liked ? -1 : 1)),
      };
      pending.current[key] = next;
      return { ...previous, [key]: next };
    });

    fetch("/api/engagement/like", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ kind, slug }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.success) return;
        delete pending.current[key];
        setCounts((previous) => ({ ...previous, [key]: payload.data }));
      })
      .catch(() => {
        // Put it back. A like that silently did not happen is worse than one
        // that visibly did not.
        delete pending.current[key];
        setCounts((previous) => {
          const current = previous[key];
          if (!current) return previous;
          return {
            ...previous,
            [key]: {
              ...current,
              liked: !current.liked,
              likes: Math.max(0, current.likes + (current.liked ? -1 : 1)),
            },
          };
        });
      });
  }, []);

  const noteComment = useCallback((kind: ContentKind, slug: string) => {
    const key = engagementKey(kind, slug);
    setCounts((previous) => {
      const current = previous[key] ?? ZERO_COUNTS;
      return { ...previous, [key]: { ...current, comments: current.comments + 1 } };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ counts, ready, toggleLike, noteComment }),
    [counts, ready, toggleLike, noteComment],
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

/**
 * Counts for one item.
 *
 * Returns `ready: false` outside a provider too, so a card dropped onto a page
 * that has not been wired up renders without its counters instead of throwing.
 */
export function useEngagement(kind: ContentKind, slug: string) {
  const context = useContext(EngagementContext);
  const key = engagementKey(kind, slug);

  return {
    counts: context?.counts[key] ?? ZERO_COUNTS,
    ready: Boolean(context?.ready && context.counts[key]),
    toggleLike: () => context?.toggleLike(kind, slug),
    noteComment: () => context?.noteComment(kind, slug),
  };
}

/** Fires the view beacon once per mount. Detail pages only. */
export function useRecordView(kind: ContentKind, slug: string) {
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/engagement/view", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ kind, slug }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [kind, slug]);
}
