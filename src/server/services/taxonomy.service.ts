import { prisma } from "@/server/db";
import { slugify } from "@/server/schemas/common";

/** Categories and tags, shared across every content type. */

export function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { blogs: true, insights: true, caseStudies: true } },
    },
  });
}

export function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { blogs: true, insights: true, caseStudies: true } } },
  });
}

export async function upsertCategory(name: string, description?: string) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { slug },
    create: { name, slug, description: description || null },
    update: { name, description: description || null },
  });
}

export async function upsertTag(name: string) {
  const slug = slugify(name);
  return prisma.tag.upsert({ where: { slug }, create: { name, slug }, update: { name } });
}

/** Resolves free-typed tag names to ids, creating any that are new. */
export async function resolveTagIds(names: string[]) {
  const ids: string[] = [];
  for (const name of names.map((n) => n.trim()).filter(Boolean).slice(0, 20)) {
    const tag = await upsertTag(name);
    ids.push(tag.id);
  }
  return ids;
}

export function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

export function deleteTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}
