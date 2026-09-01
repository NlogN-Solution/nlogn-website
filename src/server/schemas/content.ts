import { z } from "zod";
import { cuidSchema, editorDocSchema, seoSchema, slugSchema, statusSchema } from "@/server/schemas/common";

/**
 * Blogs and insights share a shape, so they share a schema. Case studies do not
 * — they are structured records, not articles — and have their own below.
 */

const articleBase = z.object({
  title: z.string().trim().min(3, "Give it a title.").max(220),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(600).optional().or(z.literal("")),
  content: editorDocSchema.nullish(),
  status: statusSchema.default("DRAFT"),
  featured: z.boolean().default(false),
  authorId: cuidSchema.nullish(),
  authorName: z.string().trim().max(120).optional().or(z.literal("")),
  authorRole: z.string().trim().max(160).optional().or(z.literal("")),
  categoryId: cuidSchema.nullish(),
  tagIds: z.array(cuidSchema).max(20).optional(),
  coverMediaId: cuidSchema.nullish(),
  scheduledFor: z.coerce.date().nullish(),
});

export const createArticleSchema = articleBase.merge(seoSchema);
export const updateArticleSchema = articleBase.partial().merge(seoSchema.partial());

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

const metricSchema = z.object({
  value: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
});

const caseBase = z.object({
  projectName: z.string().trim().min(2, "Give the project a name.").max(200),
  clientName: z.string().trim().min(1, "Who was it for?").max(200),
  slug: slugSchema.optional(),
  status: statusSchema.default("DRAFT"),
  featured: z.boolean().default(false),

  industry: z.string().trim().max(120).optional().or(z.literal("")),
  projectType: z.string().trim().max(120).optional().or(z.literal("")),
  shortDescription: z.string().trim().max(400).optional().or(z.literal("")),
  summary: z.string().trim().max(1200).optional().or(z.literal("")),

  challenge: z.string().trim().max(6000).optional().or(z.literal("")),
  approach: z.array(z.string().trim().min(1).max(600)).max(12).optional(),
  solution: z.string().trim().max(6000).optional().or(z.literal("")),
  implementation: z.string().trim().max(6000).optional().or(z.literal("")),
  outcome: z.string().trim().max(6000).optional().or(z.literal("")),
  technologies: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  servicesUsed: z.array(z.string().trim().min(1).max(80)).max(20).optional(),

  clientObjective: z.string().trim().max(2000).optional().or(z.literal("")),
  metrics: z.array(metricSchema).max(8).optional(),
  timeline: z.string().trim().max(120).optional().or(z.literal("")),
  year: z.string().trim().max(12).optional().or(z.literal("")),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #6c47ff.")
    .optional()
    .or(z.literal("")),

  testimonialQuote: z.string().trim().max(1200).optional().or(z.literal("")),
  testimonialName: z.string().trim().max(120).optional().or(z.literal("")),
  testimonialRole: z.string().trim().max(160).optional().or(z.literal("")),

  heroMediaId: cuidSchema.nullish(),
  thumbnailId: cuidSchema.nullish(),
  galleryIds: z.array(cuidSchema).max(24).optional(),

  categoryId: cuidSchema.nullish(),
  tagIds: z.array(cuidSchema).max(20).optional(),
});

export const createCaseStudySchema = caseBase.merge(seoSchema.omit({ ogTitle: true, ogDescription: true }));
export const updateCaseStudySchema = caseBase.partial().merge(
  seoSchema.omit({ ogTitle: true, ogDescription: true }).partial(),
);

export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;
export type UpdateCaseStudyInput = z.infer<typeof updateCaseStudySchema>;

export const taxonomySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugSchema.optional(),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});
