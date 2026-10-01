import { z } from "zod";

/** Shared field shapes, so a slug means the same thing on every content type. */

export const slugSchema = z
  .string()
  .trim()
  .min(1, "A slug is required.")
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

export const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const cuidSchema = z.string().trim().min(1).max(40);

export const seoSchema = z.object({
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(400).optional().or(z.literal("")),
  canonicalUrl: z.string().trim().url("That is not a valid URL.").optional().or(z.literal("")),
  ogTitle: z.string().trim().max(200).optional().or(z.literal("")),
  ogDescription: z.string().trim().max(400).optional().or(z.literal("")),
  ogImageId: cuidSchema.nullish(),
  noIndex: z.boolean().optional(),
});

/** TipTap document. Validated as a shape, then rendered by the allow-list renderer. */
export const editorDocSchema = z
  .object({ type: z.literal("doc"), content: z.array(z.record(z.string(), z.unknown())).optional() })
  .passthrough();

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}
