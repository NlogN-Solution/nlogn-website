/**
 * Shared vocabulary for views, likes and comments.
 *
 * Content is addressed by kind + slug rather than by id, because the committed
 * MDX posts and the hardcoded case studies have no id — see the schema comment
 * on `ContentStat`. A key is the two joined, and it is the same string on the
 * client, in the API and in the cache.
 */

export type ContentKind = "BLOG" | "INSIGHT" | "CASE_STUDY" | "RESOURCE";

export type EngagementKey = `${ContentKind}:${string}`;

export type EngagementCounts = {
  views: number;
  likes: number;
  comments: number;
  /** Whether *this* visitor has liked it. Never cached across visitors. */
  liked: boolean;
};

export const ZERO_COUNTS: EngagementCounts = { views: 0, likes: 0, comments: 0, liked: false };

export function engagementKey(kind: ContentKind, slug: string): EngagementKey {
  return `${kind}:${slug}`;
}

export function parseEngagementKey(key: string): { kind: ContentKind; slug: string } | null {
  const index = key.indexOf(":");
  if (index < 1) return null;

  const kind = key.slice(0, index);
  const slug = key.slice(index + 1);
  if (kind !== "BLOG" && kind !== "INSIGHT" && kind !== "CASE_STUDY" && kind !== "RESOURCE") {
    return null;
  }
  if (!slug) return null;

  return { kind, slug };
}

/** `Post.kind` is the site's own word for the same distinction. */
export function kindFromPost(postKind: string | undefined): ContentKind {
  return postKind === "insight" ? "INSIGHT" : "BLOG";
}

/* ── the visitor id ──────────────────────────────────────────────────────────
 *
 * A random id in localStorage, not a cookie.
 *
 * This site sets no cookie until the visitor has agreed to one (see
 * `lib/consent.ts`), and a like that only works after accepting cookies is a
 * like that mostly does not work. localStorage carries the same weight here and
 * keeps that promise intact.
 *
 * It is not an identity and cannot be one: clearing site data earns a second
 * like, and the header is client-supplied either way — a cookie would be no
 * harder to forge. The server falls back to a hash of IP and user-agent when
 * the header is missing, so a visitor with storage disabled still counts once,
 * and per-IP rate limits are what actually keep the numbers honest.
 */

export const VISITOR_HEADER = "x-nlogn-visitor";
const VISITOR_STORAGE_KEY = "nlogn.visitor.v1";

/** Reads the stored id, minting one on first use. Empty string if storage is blocked. */
export function visitorId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;

    const minted = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, minted);
    return minted;
  } catch {
    // Private mode, or storage blocked outright. The server falls back to a
    // hash of the request, so the call is still worth making.
    return "";
  }
}
