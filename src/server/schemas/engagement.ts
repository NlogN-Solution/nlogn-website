import { z } from "zod";
import { slugSchema } from "@/server/schemas/common";

/** Shapes for the public engagement endpoints. */

export const contentKindSchema = z.enum(["BLOG", "INSIGHT", "CASE_STUDY"]);

export const engagementTargetSchema = z.object({
  kind: contentKindSchema,
  slug: slugSchema,
});

export const commentSchema = engagementTargetSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Please give your full name.")
    .max(80, "That name is too long.")
    // A name is not an address bar. Blocks the drive-by link spam that arrives
    // in the name field rather than the comment.
    .regex(/^[^<>{}[\]()@/\\|]*$/, "Please use your name without symbols or links.")
    .refine((value) => value.includes(" "), "Please give your first and last name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .email("That does not look like an email address."),
  body: z
    .string()
    .trim()
    .min(4, "Please write a comment.")
    .max(2000, "Comments are limited to 2,000 characters."),
});

export type CommentInput = z.infer<typeof commentSchema>;

/**
 * A batch of keys for one listing page.
 *
 * Capped, because this is an unauthenticated endpoint and the cap is what stops
 * one request asking for the whole table.
 */
export const keysQuerySchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .transform((value) => value.split(",").map((part) => part.trim()).filter(Boolean))
  .refine((keys) => keys.length <= 60, "Too many items in one request.");
