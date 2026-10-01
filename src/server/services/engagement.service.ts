import { createHash } from "node:crypto";
import { prisma, dbRead } from "@/server/db";
import { ZERO_COUNTS, type ContentKind, type EngagementCounts } from "@/lib/engagement";
import { VISITOR_HEADER } from "@/lib/engagement";
import { clientIp } from "@/lib/rate-limit";
import type { CommentInput } from "@/server/schemas/engagement";

/**
 * Views, likes and comments.
 *
 * Two layers on purpose. `ContentView` and `ContentLike` are ledgers with a
 * unique constraint per visitor, and they are the truth — a refresh cannot move
 * a view, and a like is the row's existence rather than a flag that can drift.
 * `ContentStat` is the denormalised copy the public pages read, so a listing of
 * nine cards costs nine indexed row reads instead of twenty-seven aggregates.
 *
 * The ledger is always written first. If the counter update then fails, the
 * count is low by one and `recount()` can repair it; the reverse order would
 * inflate a number with nothing to check it against.
 *
 * Every read is wrapped in `dbRead`, so a database outage renders the pages
 * with zeros rather than failing them — the article is the point, the count is
 * decoration.
 */

/* ── identity ────────────────────────────────────────────────────────────── */

/**
 * Who this visitor is, for deduplication only.
 *
 * The client sends a random id it keeps in localStorage. When that is missing —
 * storage blocked, or a request that never ran the script — a hash of IP and
 * user-agent stands in, so the visit still counts exactly once instead of not
 * at all. The hash is salted per-kind-of-thing rather than stored raw, so this
 * column is not a log of who read what from which address.
 */
export function visitorIdFrom(headers: Headers): string {
  const supplied = headers.get(VISITOR_HEADER)?.trim();

  // Length-capped and format-checked: this string reaches a unique index.
  if (supplied && /^[A-Za-z0-9-]{8,64}$/.test(supplied)) return supplied;

  const ip = clientIp(headers);
  const agent = headers.get("user-agent") ?? "";
  return `anon-${createHash("sha256").update(`${ip}|${agent}`).digest("base64url").slice(0, 32)}`;
}

/* ── reads ───────────────────────────────────────────────────────────────── */

type Target = { kind: ContentKind; slug: string };

/**
 * Counts for a batch of items, plus whether this visitor liked each one.
 *
 * One query for the counters and one for this visitor's likes, whatever the
 * batch size — the listing pages ask for every card at once.
 */
export async function readCounts(
  targets: Target[],
  visitor: string,
): Promise<Record<string, EngagementCounts>> {
  const empty: Record<string, EngagementCounts> = {};
  for (const { kind, slug } of targets) empty[`${kind}:${slug}`] = { ...ZERO_COUNTS };
  if (targets.length === 0) return empty;

  return dbRead(
    async () => {
      const where = { OR: targets.map(({ kind, slug }) => ({ kind, slug })) };

      const [stats, likes] = await Promise.all([
        prisma.contentStat.findMany({
          where,
          select: { kind: true, slug: true, views: true, likes: true, comments: true },
        }),
        prisma.contentLike.findMany({
          where: { ...where, visitorId: visitor },
          select: { kind: true, slug: true },
        }),
      ]);

      const result = { ...empty };
      for (const stat of stats) {
        result[`${stat.kind}:${stat.slug}`] = {
          views: stat.views,
          likes: stat.likes,
          comments: stat.comments,
          liked: false,
        };
      }
      for (const like of likes) {
        const key = `${like.kind}:${like.slug}`;
        if (result[key]) result[key].liked = true;
      }
      return result;
    },
    empty,
    "engagement counts",
  );
}

/* ── writes ──────────────────────────────────────────────────────────────── */

type Delta = Partial<Record<"views" | "likes" | "comments", number>>;

/** Applies a delta to the denormalised counters, creating the row on first use. */
async function bump(kind: ContentKind, slug: string, delta: Delta) {
  const increments = Object.fromEntries(
    Object.entries(delta).map(([field, by]) => [field, { increment: by }]),
  );
  // A counter can only be driven by a ledger row, so a negative total is not
  // reachable — but clamping here means a repair is never needed for one.
  const seed = Object.fromEntries(
    Object.entries(delta).map(([field, by]) => [field, Math.max(0, by)]),
  );

  await prisma.contentStat.upsert({
    where: { kind_slug: { kind, slug } },
    create: { kind, slug, ...seed },
    update: increments,
  });
}

/**
 * Records a view, once per visitor per item, ever.
 *
 * `skipDuplicates` makes the unique index do the deduplication in one
 * round-trip: `count` is 1 for a genuinely new reader and 0 for a refresh, so
 * the counter moves exactly when it should.
 */
export async function recordView(kind: ContentKind, slug: string, visitor: string) {
  return dbRead(
    async () => {
      const inserted = await prisma.contentView.createMany({
        data: [{ kind, slug, visitorId: visitor }],
        skipDuplicates: true,
      });
      if (inserted.count > 0) await bump(kind, slug, { views: 1 });
      return { counted: inserted.count > 0 };
    },
    { counted: false },
    "record view",
  );
}

/** Likes if not liked, unlikes if liked. Returns the state the visitor now sees. */
export async function toggleLike(kind: ContentKind, slug: string, visitor: string) {
  return dbRead(
    async () => {
      const key = { kind_slug_visitorId: { kind, slug, visitorId: visitor } };
      const existing = await prisma.contentLike.findUnique({ where: key });

      if (existing) {
        await prisma.contentLike.delete({ where: key });
        await bump(kind, slug, { likes: -1 });
        return { liked: false };
      }

      // A double-click can race two inserts through the check above; the unique
      // index rejects the second, and swallowing that is the whole handling —
      // the visitor's like is already recorded.
      const inserted = await prisma.contentLike.createMany({
        data: [{ kind, slug, visitorId: visitor }],
        skipDuplicates: true,
      });
      if (inserted.count > 0) await bump(kind, slug, { likes: 1 });
      return { liked: true };
    },
    { liked: false },
    "toggle like",
  );
}

/* ── comments ────────────────────────────────────────────────────────────── */

/** What the public thread is allowed to see. The email address is not in it. */
export type PublicComment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

export async function listComments(kind: ContentKind, slug: string): Promise<PublicComment[]> {
  return dbRead(
    async () => {
      const rows = await prisma.contentComment.findMany({
        where: { kind, slug, status: "PUBLISHED" },
        // Oldest first: a thread reads as a conversation, not a feed.
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { id: true, name: true, body: true, createdAt: true },
      });
      return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
    },
    [],
    "list comments",
  );
}

export async function createComment(
  input: CommentInput,
  meta: { ip: string | null; userAgent: string | null },
): Promise<PublicComment | null> {
  return dbRead(
    async () => {
      const row = await prisma.contentComment.create({
        data: {
          kind: input.kind,
          slug: input.slug,
          name: input.name,
          email: input.email,
          body: input.body,
          ip: meta.ip,
          userAgent: meta.userAgent?.slice(0, 400) ?? null,
        },
        select: { id: true, name: true, body: true, createdAt: true },
      });

      await bump(input.kind, input.slug, { comments: 1 });
      return { ...row, createdAt: row.createdAt.toISOString() };
    },
    null,
    "create comment",
  );
}

/**
 * Rebuilds the denormalised counters for one item from the ledgers.
 *
 * The counter and its ledger can only diverge if a process dies between the two
 * writes. This is the repair, and it is what the admin's hide/delete actions
 * call rather than decrementing by hand — a recount cannot drift.
 */
export async function recount(kind: ContentKind, slug: string) {
  const [views, likes, comments] = await Promise.all([
    prisma.contentView.count({ where: { kind, slug } }),
    prisma.contentLike.count({ where: { kind, slug } }),
    prisma.contentComment.count({ where: { kind, slug, status: "PUBLISHED" } }),
  ]);

  await prisma.contentStat.upsert({
    where: { kind_slug: { kind, slug } },
    create: { kind, slug, views, likes, comments },
    update: { views, likes, comments },
  });

  return { views, likes, comments };
}

/* ── moderation ──────────────────────────────────────────────────────────── */

/**
 * The admin's view of a comment. This one *does* carry the email address —
 * knowing who wrote something is the point of a moderation screen, and this
 * path is behind `messages:read`.
 */
export async function listCommentsForAdmin(params: {
  page: number;
  perPage: number;
  skip: number;
  take: number;
  q?: string;
  status?: string;
  kind?: string;
}) {
  const status = ["PUBLISHED", "HIDDEN", "SPAM"].includes(params.status ?? "")
    ? (params.status as "PUBLISHED" | "HIDDEN" | "SPAM")
    : undefined;
  const kind = ["BLOG", "INSIGHT", "CASE_STUDY", "RESOURCE"].includes(params.kind ?? "")
    ? (params.kind as ContentKind)
    : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
            { body: { contains: params.q, mode: "insensitive" as const } },
            { slug: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total, pending] = await Promise.all([
    prisma.contentComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.contentComment.count({ where }),
    prisma.contentComment.count({ where: { status: "PUBLISHED" } }),
  ]);

  return { items, total, pending };
}

/**
 * Hides, unhides or marks a comment as spam.
 *
 * Followed by a recount rather than a decrement: the public counter is derived
 * from the ledger, so a repair is the same operation as an update and cannot
 * leave the number one out.
 */
export async function setCommentStatus(id: string, status: "PUBLISHED" | "HIDDEN" | "SPAM") {
  const updated = await prisma.contentComment.update({ where: { id }, data: { status } });
  await recount(updated.kind, updated.slug);
  return updated;
}

export async function deleteComment(id: string) {
  const deleted = await prisma.contentComment.delete({ where: { id } });
  await recount(deleted.kind, deleted.slug);
  return deleted;
}
