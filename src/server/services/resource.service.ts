import { prisma, dbRead } from "@/server/db";
import { slugify } from "@/server/schemas/common";
import { sanitizeArticleHtml } from "@/server/content-sanitize";
import { cdnUrl } from "@/server/integrations/cloudinary";
import { editorMediaSelect } from "@/server/services/media.service";
import type { CreateResourceInput, UpdateResourceInput } from "@/server/schemas/resources";
import type { ContentStatus, Prisma, ResourceType } from "@/generated/prisma";

/**
 * The resource library: reads for the public pages, CRUD for the admin.
 *
 * The one rule that shapes this file: **the gated payload never leaves the
 * server on a public read.** `fileMedia`, `externalUrl` and the private half of
 * the record are stripped in `toPublic` rather than filtered in the component,
 * because a component that forgets is a silent leak and a select that forgets
 * is a missing field somebody notices immediately.
 */

const listInclude = {
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
  coverMedia: { select: editorMediaSelect },
};

const detailInclude = {
  ...listInclude,
  fileMedia: { select: editorMediaSelect },
  ogImage: { select: editorMediaSelect },
};

/** A slug unique across the library. The counter suffix keeps a second "Starter kit" saveable. */
export async function uniqueResourceSlug(desired: string, excludeId?: string) {
  const base = slugify(desired) || "resource";
  let candidate = base;
  for (let n = 2; n < 200; n++) {
    const clash = await prisma.resource.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

/** Empty strings from a form mean "cleared", not "unchanged". */
function blankToNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

type WriteMode = "create" | "update";

/**
 * Relations rather than scalar foreign keys, for the reason spelled out in
 * `article.service.ts`: Prisma refuses a write that mixes the two, and
 * `disconnect` exists only on the update input — sending it to `create` fails
 * validation and loses the whole record.
 */
function relation(id: string | null | undefined, mode: WriteMode) {
  if (id === undefined) return undefined;
  if (id) return { connect: { id } };
  return mode === "create" ? undefined : { disconnect: true };
}

function buildData(
  input: CreateResourceInput | UpdateResourceInput,
  mode: WriteMode,
  slug?: string,
) {
  const html =
    typeof input.descriptionHtml === "string"
      ? sanitizeArticleHtml(input.descriptionHtml)
      : input.descriptionHtml === null
        ? null
        : undefined;

  return {
    ...(slug ? { slug } : {}),
    title: input.title,
    summary: blankToNull(input.summary),
    descriptionHtml: html,
    type: input.type,
    gate: input.gate,
    status: input.status,
    featured: input.featured,
    includes: input.includes,
    licence: blankToNull(input.licence),
    version: blankToNull(input.version),
    fileLabel: blankToNull(input.fileLabel),
    externalUrl: blankToNull(input.externalUrl),
    repoUrl: blankToNull(input.repoUrl),
    demoUrl: blankToNull(input.demoUrl),
    seoTitle: blankToNull(input.seoTitle),
    seoDescription: blankToNull(input.seoDescription),
    canonicalUrl: blankToNull(input.canonicalUrl),
    noIndex: input.noIndex,
    category: relation(input.categoryId, mode),
    coverMedia: relation(input.coverMediaId, mode),
    fileMedia: relation(input.fileMediaId, mode),
    ogImage: relation(input.ogImageId, mode),
    ...(input.tagIds ? { tags: { set: input.tagIds.map((id) => ({ id })) } } : {}),
  };
}

/**
 * `publishedAt` is stamped the first time a record goes live and never moved
 * again, so an edit two months later does not re-date the listing.
 */
function publishStamp(status: ContentStatus | undefined, existing: Date | null) {
  if (status !== "PUBLISHED") return undefined;
  return existing ? undefined : new Date();
}

/* ── admin ───────────────────────────────────────────────────────────────── */

export async function listResources(filters: {
  q?: string;
  status?: string;
  category?: string;
  sort?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.ResourceWhereInput = {};
  if (filters.status && filters.status !== "all") where.status = filters.status as ContentStatus;
  if (filters.category && filters.category !== "all") where.category = { slug: filters.category };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { summary: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ResourceOrderByWithRelationInput =
    filters.sort === "oldest"
      ? { createdAt: "asc" }
      : filters.sort === "updated"
        ? { updatedAt: "desc" }
        : filters.sort === "title"
          ? { title: "asc" }
          : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      skip: filters.skip,
      take: filters.take,
      include: {
        ...listInclude,
        _count: { select: { leads: true, links: true } },
      },
    }),
    prisma.resource.count({ where }),
  ]);

  return { items, total };
}

export function getResource(id: string) {
  return prisma.resource.findUnique({
    where: { id },
    include: { ...detailInclude, links: { orderBy: { createdAt: "desc" } } },
  });
}

export async function createResource(input: CreateResourceInput) {
  const slug = await uniqueResourceSlug(input.slug || input.title);
  const data = buildData(input, "create", slug);

  return prisma.resource.create({
    data: {
      ...data,
      publishedAt: publishStamp(input.status, null),
      ...(input.tagIds ? { tags: { connect: input.tagIds.map((id) => ({ id })) } } : {}),
    } as Prisma.ResourceCreateInput,
    include: detailInclude,
  });
}

export async function updateResource(id: string, input: UpdateResourceInput) {
  const existing = await prisma.resource.findUnique({
    where: { id },
    select: { publishedAt: true, slug: true },
  });
  if (!existing) return null;

  const slug = input.slug ? await uniqueResourceSlug(input.slug, id) : undefined;

  return prisma.resource.update({
    where: { id },
    data: {
      ...buildData(input, "update", slug),
      publishedAt: publishStamp(input.status, existing.publishedAt),
    } as Prisma.ResourceUpdateInput,
    include: detailInclude,
  });
}

export function deleteResource(id: string) {
  // Leads, grants and short links all cascade — a deleted resource must not
  // leave live `/r/<code>` links pointing at nothing.
  return prisma.resource.delete({ where: { id } });
}

/* ── public ──────────────────────────────────────────────────────────────── */

/** What a public page is allowed to see. Deliberately not the row. */
export type PublicResource = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  descriptionHtml: string | null;
  type: ResourceType;
  gate: "FREE" | "EMAIL" | "ACCOUNT";
  featured: boolean;
  includes: string[];
  licence: string | null;
  version: string | null;
  fileLabel: string | null;
  /**
   * Advertised destinations, not gated ones — see the `ResourceGate` doc. A repo
   * URL and an ungated external link are public facts about a public thing;
   * hiding them behind a form only costs conversions. On an EMAIL resource both
   * are null and `hasFile` is what the gate promises.
   */
  repoUrl: string | null;
  externalUrl: string | null;
  demoUrl: string | null;
  /**
   * Whether each destination exists at all, regardless of the gate. A gated
   * resource keeps its URLs to itself, but the button in front of the form
   * still has to say what it opens — "Take me to the repo" rather than
   * "Download" — and a boolean says that without leaking where.
   */
  hasFile: boolean;
  hasRepo: boolean;
  hasExternal: boolean;
  coverUrl: string | null;
  coverAlt: string | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  downloads: number;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  noIndex: boolean;
};

type ResourceRow = Prisma.ResourceGetPayload<{ include: typeof detailInclude }>;

/**
 * The projection that keeps the payload private.
 *
 * `fileMedia.secureUrl` never leaves this function, and `externalUrl` leaves it
 * only on a FREE resource. On a gated one the sole route to either is
 * `/api/resources/download/<token>`, after a grant has been issued.
 */
function toPublic(row: ResourceRow): PublicResource {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    descriptionHtml: row.descriptionHtml,
    type: row.type,
    gate: row.gate,
    featured: row.featured,
    includes: row.includes,
    licence: row.licence,
    version: row.version,
    fileLabel: row.fileLabel,
    repoUrl: row.gate === "FREE" ? row.repoUrl : null,
    externalUrl: row.gate === "FREE" ? row.externalUrl : null,
    demoUrl: row.demoUrl,
    hasFile: Boolean(row.fileMediaId),
    hasRepo: Boolean(row.repoUrl),
    hasExternal: Boolean(row.externalUrl),
    coverUrl: row.coverMedia ? cdnUrl(row.coverMedia.secureUrl, "card") : null,
    coverAlt: row.coverMedia?.alt ?? null,
    category: row.category ? { name: row.category.name, slug: row.category.slug } : null,
    tags: row.tags.map((tag) => ({ name: tag.name, slug: tag.slug })),
    downloads: row.downloads,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    ogImageUrl: row.ogImage ? cdnUrl(row.ogImage.secureUrl, "og") : null,
    noIndex: row.noIndex,
  };
}

/**
 * Every public read falls back to an empty library rather than failing the
 * page, the same bargain the rest of the site makes: a CMS outage must not be
 * a website outage.
 */
export function getPublishedResources(): Promise<PublicResource[]> {
  return dbRead(
    async () => {
      const rows = await prisma.resource.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        include: detailInclude,
      });
      return rows.map(toPublic);
    },
    [],
    "published resources",
  );
}

export function getPublishedResource(slug: string): Promise<PublicResource | null> {
  return dbRead(
    async () => {
      const row = await prisma.resource.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: detailInclude,
      });
      return row ? toPublic(row) : null;
    },
    null,
    `resource ${slug}`,
  );
}

/** Slugs for the sitemap, and for `generateStaticParams` on the detail route. */
export function getPublishedResourceSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return dbRead(
    () =>
      prisma.resource.findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    [],
    "resource slugs",
  );
}
