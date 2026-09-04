import { prisma } from "@/server/db";
import { slugify } from "@/server/schemas/common";
import { renderEditorDoc, editorPlainText, readingMinutes } from "@/server/content-render";
import type { CreateArticleInput, UpdateArticleInput } from "@/server/schemas/content";
import type { ContentStatus, Prisma } from "@/generated/prisma";

/**
 * Blogs and insights.
 *
 * Prisma generates structurally identical delegates for the two models, so one
 * implementation serves both rather than two copies drifting apart. The kind is
 * passed in; everything else is shared.
 */

export type ArticleKind = "blog" | "insight";

/** The slice of a Prisma delegate this service touches. */
type ArticleDelegate = {
  findMany(args?: unknown): Promise<Record<string, unknown>[]>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  create(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<Record<string, unknown>>;
  delete(args: unknown): Promise<Record<string, unknown>>;
  count(args?: unknown): Promise<number>;
};

function delegate(kind: ArticleKind): ArticleDelegate {
  return (kind === "blog" ? prisma.blog : prisma.insight) as unknown as ArticleDelegate;
}

const listInclude = {
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
  coverMedia: { select: { id: true, secureUrl: true, alt: true, width: true, height: true } },
  author: { select: { id: true, name: true, email: true } },
};

const detailInclude = {
  ...listInclude,
  ogImage: { select: { id: true, secureUrl: true } },
};

/**
 * A slug that is unique for its model. The counter suffix keeps a second
 * "Getting started" from failing the unique constraint on save.
 */
export async function uniqueSlug(kind: ArticleKind, desired: string, excludeId?: string) {
  const base = slugify(desired) || "untitled";
  let candidate = base;
  for (let n = 2; n < 200; n++) {
    const clash = await delegate(kind).findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

/** Empty strings from a form mean "cleared", not "unchanged". */
/** Whether the payload being built is for a `create` or an `update`. */
type WriteMode = "create" | "update";

/**
 * Prisma refuses a write that mixes scalar foreign keys (`categoryId`) with
 * relation operations (`tags: { connect }`) — the two belong to different
 * generated input types. Everything therefore goes through relations.
 *
 * `undefined` leaves the link untouched; `null` clears it.
 *
 * `disconnect` exists only on the update input. A create has no existing link
 * to sever, so a cleared field there is simply absent — sending `disconnect`
 * to `create` fails validation with "Unknown argument `disconnect`" and loses
 * the whole post. The editor sends every optional media field on save,
 * including the empty ones, so this is the ordinary path, not an edge case.
 */
function relation(id: string | null | undefined, mode: WriteMode) {
  if (id === undefined) return undefined;
  if (id) return { connect: { id } };
  return mode === "create" ? undefined : { disconnect: true };
}

function blankToNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildData(input: CreateArticleInput | UpdateArticleInput, mode: WriteMode) {
  const html = input.content ? renderEditorDoc(input.content) : undefined;
  const plain = input.content ? editorPlainText(input.content) : undefined;

  return {
    title: input.title,
    excerpt:
      blankToNull(input.excerpt) ??
      (plain ? plain.slice(0, 260).trim() + (plain.length > 260 ? "…" : "") : undefined),
    content: (input.content ?? undefined) as Prisma.InputJsonValue | undefined,
    contentHtml: html,
    readingMinutes: input.content ? readingMinutes(input.content) : undefined,
    status: input.status,
    featured: input.featured,
    author: relation(input.authorId, mode),
    authorName: blankToNull(input.authorName),
    authorRole: blankToNull(input.authorRole),
    category: relation(input.categoryId, mode),
    coverMedia: relation(input.coverMediaId, mode),
    scheduledFor: input.scheduledFor ?? undefined,
    seoTitle: blankToNull(input.seoTitle),
    seoDescription: blankToNull(input.seoDescription),
    canonicalUrl: blankToNull(input.canonicalUrl),
    ogTitle: blankToNull(input.ogTitle),
    ogDescription: blankToNull(input.ogDescription),
    ogImage: relation(input.ogImageId, mode),
    noIndex: input.noIndex,
  };
}

export type ArticleListFilters = {
  q?: string;
  status?: string;
  category?: string;
  sort?: string;
  skip: number;
  take: number;
};

export async function listArticles(kind: ArticleKind, filters: ArticleListFilters) {
  const where: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") where.status = filters.status as ContentStatus;
  if (filters.category && filters.category !== "all") where.category = { slug: filters.category };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { excerpt: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    filters.sort === "oldest"
      ? { createdAt: "asc" }
      : filters.sort === "title"
        ? { title: "asc" }
        : filters.sort === "updated"
          ? { updatedAt: "desc" }
          : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    delegate(kind).findMany({
      where,
      include: listInclude,
      orderBy,
      skip: filters.skip,
      take: filters.take,
    }),
    delegate(kind).count({ where }),
  ]);

  return { items, total };
}

export async function getArticle(kind: ArticleKind, id: string) {
  return delegate(kind).findUnique({ where: { id }, include: detailInclude });
}

/** The current slug only — used to invalidate a renamed article's previous URL. */
export async function getArticleSlug(kind: ArticleKind, id: string): Promise<string | undefined> {
  const row = (await delegate(kind).findUnique({
    where: { id },
    select: { slug: true },
  })) as { slug: string } | null;
  return row?.slug;
}

export async function getArticleBySlug(kind: ArticleKind, slug: string) {
  return delegate(kind).findUnique({ where: { slug }, include: detailInclude });
}

export async function createArticle(kind: ArticleKind, input: CreateArticleInput) {
  const slug = await uniqueSlug(kind, input.slug || input.title);
  const publishing = input.status === "PUBLISHED";

  return delegate(kind).create({
    data: {
      ...buildData(input, "create"),
      slug,
      publishedAt: publishing ? new Date() : null,
      ...(input.tagIds?.length ? { tags: { connect: input.tagIds.map((id) => ({ id })) } } : {}),
    },
    include: detailInclude,
  });
}

export async function updateArticle(kind: ArticleKind, id: string, input: UpdateArticleInput) {
  const existing = (await delegate(kind).findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, publishedAt: true },
  })) as { slug: string; status: ContentStatus; publishedAt: Date | null } | null;

  if (!existing) return null;

  const data = buildData(input, "update") as Record<string, unknown>;

  // A slug is only regenerated when the editor actually changed it. Renaming a
  // post must not silently move a URL that is already indexed.
  if (input.slug && input.slug !== existing.slug) {
    const next = await uniqueSlug(kind, input.slug, id);
    data.slug = next;
    if (existing.status === "PUBLISHED") {
      await prisma.redirect
        .upsert({
          where: { fromPath: `/${kind === "blog" ? "blog" : "insights"}/${existing.slug}` },
          create: {
            fromPath: `/${kind === "blog" ? "blog" : "insights"}/${existing.slug}`,
            toPath: `/${kind === "blog" ? "blog" : "insights"}/${next}`,
            reason: "Slug changed after publication",
          },
          update: { toPath: `/${kind === "blog" ? "blog" : "insights"}/${next}` },
        })
        .catch(() => undefined);
    }
  }

  // First publish stamps the date; later edits leave it alone.
  if (input.status === "PUBLISHED" && !existing.publishedAt) data.publishedAt = new Date();
  if (input.status === "DRAFT") data.publishedAt = null;

  if (input.tagIds) {
    data.tags = { set: input.tagIds.map((tagId) => ({ id: tagId })) };
  }

  return delegate(kind).update({ where: { id }, data, include: detailInclude });
}

export async function deleteArticle(kind: ArticleKind, id: string) {
  return delegate(kind).delete({ where: { id } });
}

/**
 * What the public site is allowed to see: published, and past its scheduled
 * time if one was set. Everything public reads through this.
 */
export async function listPublishedArticles(kind: ArticleKind, opts: { take?: number } = {}) {
  const now = new Date();
  return delegate(kind).findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    include: listInclude,
    orderBy: { publishedAt: "desc" },
    ...(opts.take ? { take: opts.take } : {}),
  });
}

export async function getPublishedArticleBySlug(kind: ArticleKind, slug: string) {
  const now = new Date();
  return delegate(kind).findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    include: detailInclude,
  });
}
