import { prisma } from "@/server/db";
import { slugify } from "@/server/schemas/common";
import type { CreateCaseStudyInput, UpdateCaseStudyInput } from "@/server/schemas/content";
import type { ContentStatus, Prisma } from "@/generated/prisma";

/**
 * Case studies are structured records rather than articles: the public template
 * reads discrete fields, so the service keeps them discrete rather than
 * flattening everything into one content blob.
 */

const listInclude = {
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
  thumbnail: { select: { id: true, secureUrl: true, alt: true } },
  heroMedia: { select: { id: true, secureUrl: true, alt: true } },
};

const detailInclude = {
  ...listInclude,
  gallery: { select: { id: true, secureUrl: true, alt: true, caption: true, width: true, height: true } },
  ogImage: { select: { id: true, secureUrl: true } },
  author: { select: { id: true, name: true } },
};

export async function uniqueSlug(desired: string, excludeId?: string) {
  const base = slugify(desired) || "case-study";
  let candidate = base;
  for (let n = 2; n < 200; n++) {
    const clash = await prisma.caseStudy.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Prisma refuses a write that mixes scalar foreign keys (`categoryId`) with
 * relation operations (`tags: { connect }`) — the two belong to different
 * generated input types. Everything therefore goes through relations.
 *
 * `undefined` leaves the link untouched; `null` clears it.
 */
function relation(id: string | null | undefined) {
  if (id === undefined) return undefined;
  return id ? { connect: { id } } : { disconnect: true };
}

function blankToNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildData(input: CreateCaseStudyInput | UpdateCaseStudyInput) {
  return {
    projectName: input.projectName,
    clientName: input.clientName,
    status: input.status,
    featured: input.featured,
    industry: blankToNull(input.industry),
    projectType: blankToNull(input.projectType),
    shortDescription: blankToNull(input.shortDescription),
    summary: blankToNull(input.summary),
    challenge: blankToNull(input.challenge),
    approach: (input.approach ?? undefined) as Prisma.InputJsonValue | undefined,
    solution: blankToNull(input.solution),
    implementation: blankToNull(input.implementation),
    outcome: blankToNull(input.outcome),
    technologies: input.technologies,
    servicesUsed: input.servicesUsed,
    clientObjective: blankToNull(input.clientObjective),
    metrics: (input.metrics ?? undefined) as Prisma.InputJsonValue | undefined,
    timeline: blankToNull(input.timeline),
    year: blankToNull(input.year),
    accent: blankToNull(input.accent) ?? undefined,
    testimonialQuote: blankToNull(input.testimonialQuote),
    testimonialName: blankToNull(input.testimonialName),
    testimonialRole: blankToNull(input.testimonialRole),
    heroMedia: relation(input.heroMediaId),
    thumbnail: relation(input.thumbnailId),
    category: relation(input.categoryId),
    seoTitle: blankToNull(input.seoTitle),
    seoDescription: blankToNull(input.seoDescription),
    canonicalUrl: blankToNull(input.canonicalUrl),
    ogImage: relation(input.ogImageId),
    noIndex: input.noIndex,
  };
}

export async function listCaseStudies(filters: {
  q?: string;
  status?: string;
  sort?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.CaseStudyWhereInput = {};
  if (filters.status && filters.status !== "all") where.status = filters.status as ContentStatus;
  if (filters.q) {
    where.OR = [
      { projectName: { contains: filters.q, mode: "insensitive" } },
      { clientName: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.CaseStudyOrderByWithRelationInput =
    filters.sort === "oldest"
      ? { createdAt: "asc" }
      : filters.sort === "title"
        ? { projectName: "asc" }
        : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.caseStudy.findMany({
      where,
      include: listInclude,
      orderBy,
      skip: filters.skip,
      take: filters.take,
    }),
    prisma.caseStudy.count({ where }),
  ]);

  return { items, total };
}

export function getCaseStudy(id: string) {
  return prisma.caseStudy.findUnique({ where: { id }, include: detailInclude });
}

export async function createCaseStudy(input: CreateCaseStudyInput) {
  const slug = await uniqueSlug(input.slug || `${input.clientName}-${input.projectName}`);
  return prisma.caseStudy.create({
    data: {
      ...buildData(input),
      projectName: input.projectName,
      clientName: input.clientName,
      slug,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      ...(input.tagIds?.length ? { tags: { connect: input.tagIds.map((id) => ({ id })) } } : {}),
      ...(input.galleryIds?.length
        ? { gallery: { connect: input.galleryIds.map((id) => ({ id })) } }
        : {}),
    },
    include: detailInclude,
  });
}

export async function updateCaseStudy(id: string, input: UpdateCaseStudyInput) {
  const existing = await prisma.caseStudy.findUnique({
    where: { id },
    select: { slug: true, status: true, publishedAt: true },
  });
  if (!existing) return null;

  const data = buildData(input) as Prisma.CaseStudyUpdateInput & Record<string, unknown>;

  if (input.slug && input.slug !== existing.slug) {
    const next = await uniqueSlug(input.slug, id);
    data.slug = next;
    if (existing.status === "PUBLISHED") {
      await prisma.redirect
        .upsert({
          where: { fromPath: `/case-studies/${existing.slug}` },
          create: {
            fromPath: `/case-studies/${existing.slug}`,
            toPath: `/case-studies/${next}`,
            reason: "Slug changed after publication",
          },
          update: { toPath: `/case-studies/${next}` },
        })
        .catch(() => undefined);
    }
  }

  if (input.status === "PUBLISHED" && !existing.publishedAt) data.publishedAt = new Date();
  if (input.status === "DRAFT") data.publishedAt = null;

  if (input.tagIds) data.tags = { set: input.tagIds.map((tagId) => ({ id: tagId })) };
  if (input.galleryIds) data.gallery = { set: input.galleryIds.map((mid) => ({ id: mid })) };

  return prisma.caseStudy.update({ where: { id }, data, include: detailInclude });
}

export function deleteCaseStudy(id: string) {
  return prisma.caseStudy.delete({ where: { id } });
}

export function listPublishedCaseStudies() {
  return prisma.caseStudy.findMany({
    where: { status: "PUBLISHED" },
    include: detailInclude,
    orderBy: { publishedAt: "desc" },
  });
}

export function getPublishedCaseStudyBySlug(slug: string) {
  return prisma.caseStudy.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: detailInclude,
  });
}
