import { z } from "zod";
import { cuidSchema, seoSchema, slugSchema, statusSchema } from "@/server/schemas/common";
import { RESOURCE_GATES, RESOURCE_TYPES } from "@/config/resources";

/**
 * The resource library.
 *
 * Two audiences write to these tables and they need opposite treatment: an
 * authenticated admin filling in a long form, and an anonymous visitor on a
 * phone submitting one field from Instagram's in-app browser. The admin schema
 * is permissive about shape and strict about size; the unlock schema is the
 * reverse.
 */

const descriptionHtmlSchema = z.string().max(200_000, "That description is too long to store.");

const resourceBase = z.object({
  title: z.string().trim().min(3, "Give it a title.").max(220),
  slug: slugSchema.optional(),
  summary: z.string().trim().max(600).optional().or(z.literal("")),
  /** Editor HTML, sanitised by `content-sanitize` in the service before storage. */
  descriptionHtml: descriptionHtmlSchema.nullish(),
  type: z.enum(RESOURCE_TYPES).default("TEMPLATE"),
  gate: z.enum(RESOURCE_GATES).default("EMAIL"),
  status: statusSchema.default("DRAFT"),
  featured: z.boolean().default(false),

  includes: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  licence: z.string().trim().max(120).optional().or(z.literal("")),
  version: z.string().trim().max(60).optional().or(z.literal("")),
  fileLabel: z.string().trim().max(80).optional().or(z.literal("")),

  fileMediaId: cuidSchema.nullish(),
  externalUrl: z.string().trim().url("That is not a valid URL.").optional().or(z.literal("")),
  repoUrl: z.string().trim().url("That is not a valid URL.").optional().or(z.literal("")),
  demoUrl: z.string().trim().url("That is not a valid URL.").optional().or(z.literal("")),

  coverMediaId: cuidSchema.nullish(),
  categoryId: cuidSchema.nullish(),
  tagIds: z.array(cuidSchema).max(20).optional(),
  /**
   * Tags typed as free text in the editor, resolved to ids by the taxonomy
   * service. Part of the base schema rather than merged in at the route the
   * way the article ones are, because `superRefine` below returns a refined
   * schema that can no longer be merged into.
   */
  tagNames: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});

export const createResourceSchema = resourceBase
  .merge(seoSchema.omit({ ogTitle: true, ogDescription: true }))
  .superRefine((value, ctx) => {
    // A create carries the whole record, so the publishing rules can be checked
    // right here. An update cannot — see `publishBlockers` below.
    for (const issue of publishBlockers(value)) ctx.addIssue({ code: "custom", ...issue });
  });

export const updateResourceSchema = resourceBase
  .partial()
  .merge(seoSchema.omit({ ogTitle: true, ogDescription: true }).partial());

/**
 * Why this resource cannot go live yet, if it cannot.
 *
 * Checked before publishing rather than at unlock time, because the failure
 * otherwise lands on a visitor who has already handed over their address —
 * the worst possible moment to discover the file was never attached. A draft
 * may be incomplete; that is what drafts are for.
 *
 * It takes a whole record rather than a payload, and that is the point. A PATCH
 * is partial: `{ status: "PUBLISHED" }` is a perfectly ordinary body, and a
 * schema-level rule reading `fileMediaId` off it would reject a resource whose
 * file has been attached since the day it was created. The update route merges
 * the stored row with the incoming change and asks this about the result.
 */
export function publishBlockers(record: {
  status?: string;
  gate?: string | null;
  fileMediaId?: string | null;
  externalUrl?: string | null;
  repoUrl?: string | null;
}): { path: string[]; message: string }[] {
  if (record.status !== "PUBLISHED") return [];

  const blockers: { path: string[]; message: string }[] = [];

  /*
   * A repository URL, or something a previous version of the library attached.
   *
   * New resources are repos and nothing else — the admin form offers no other
   * field — so the message names the repo alone. The two legacy columns still
   * satisfy the rule because rows that predate the change hold a file or an
   * external URL and are perfectly publishable; they simply cannot be created
   * or edited into that state any more.
   */
  if (!record.repoUrl && !record.fileMediaId && !record.externalUrl) {
    blockers.push({
      path: ["repoUrl"],
      message: "Add the public repository URL before publishing.",
    });
  }

  if (record.gate === "ACCOUNT") {
    blockers.push({
      path: ["gate"],
      message: "There are no visitor accounts yet, so this resource could never be unlocked.",
    });
  }

  return blockers;
}

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

/**
 * What a visitor sends to open the gate.
 *
 * One required field. Everything else is optional, because every extra input on
 * a 380px-wide in-app browser is measurably fewer downloads — and because the
 * name is worth having only if giving it is free.
 */
export const unlockSchema = z.object({
  slug: slugSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("That does not look like an email address.")
    .max(200),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  /**
   * Consent to be emailed about anything other than this file. Defaults to
   * false: delivering what they asked for is fulfilling a request, and adding
   * them to a mailing list is not — one tick cannot honestly cover both.
   */
  marketingConsent: z.boolean().default(false),
  /** Fallback attribution for the case where the campaign cookie was blocked. */
  campaign: z.string().trim().max(80).optional().or(z.literal("")),
});

export type UnlockInput = z.infer<typeof unlockSchema>;

export const shortLinkSchema = z.object({
  /** Left blank, the service mints one. Typed by hand when a caption needs to read well. */
  code: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only.")
    .optional(),
  platform: z.string().trim().max(40).optional().or(z.literal("")),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export type ShortLinkInput = z.infer<typeof shortLinkSchema>;
