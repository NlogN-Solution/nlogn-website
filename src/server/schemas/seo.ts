import { z } from "zod";

/**
 * Validation for the SEO endpoints.
 *
 * Domains are validated by shape here and by DNS resolution in
 * `net-guard.ts` — this rejects nonsense before a lookup is attempted, and that
 * rejects anything pointing somewhere it should not.
 */

const DOMAIN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

export const domainField = z
  .string()
  .trim()
  .min(3)
  .max(253)
  // Accepts a pasted URL; `normaliseDomain` reduces it to the hostname.
  .transform((value) => value.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, ""))
  .refine((value) => DOMAIN.test(value), "Enter a valid domain, such as nlogn.com.");

/** GA4 property IDs are numeric; a "G-" measurement ID here is the classic mix-up. */
export const ga4PropertyField = z
  .string()
  .trim()
  .regex(/^\d{6,15}$/, "This is the numeric property ID, not the G- measurement ID.")
  .or(z.literal(""))
  .nullable()
  .optional();

/** Either a domain property or a URL-prefix property, exactly as Google returns it. */
export const gscSiteField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || value.startsWith("sc-domain:") || /^https?:\/\//.test(value),
    "Choose a property from the list.",
  )
  .nullable()
  .optional();

export const websiteCreateSchema = z.object({
  name: z.string().trim().min(1, "Give this website a name.").max(120),
  domain: domainField,
  ga4PropertyId: ga4PropertyField,
  gscSiteUrl: gscSiteField,
  ahrefsDomain: z.string().trim().max(253).nullable().optional(),
});

export const websiteUpdateSchema = websiteCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const syncProviderSchema = z.enum([
  "GOOGLE_SEARCH_CONSOLE",
  "GOOGLE_ANALYTICS",
  "PAGESPEED",
  "AHREFS",
  "CRAWLER",
]);

export type SyncProviderName = z.infer<typeof syncProviderSchema>;

/** Keyword-table controls. All optional; every one has a sane default. */
export const keywordQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  band: z.enum(["all", "top3", "top10", "top20", "21-50", "51-100"]).default("all"),
  minClicks: z.coerce.number().min(0).optional(),
  minImpressions: z.coerce.number().min(0).optional(),
  sort: z
    .enum(["clicks", "impressions", "ctr", "position", "change"])
    .default("clicks"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(25),
});

export type KeywordQuery = z.infer<typeof keywordQuerySchema>;

export const POSITION_BANDS: Record<
  KeywordQuery["band"],
  { min: number; max: number; label: string }
> = {
  all: { min: 0, max: Infinity, label: "All positions" },
  top3: { min: 0, max: 3.5, label: "Top 3" },
  top10: { min: 0, max: 10.5, label: "Top 10" },
  top20: { min: 0, max: 20.5, label: "Top 20" },
  "21-50": { min: 20.5, max: 50.5, label: "21–50" },
  "51-100": { min: 50.5, max: 100.5, label: "51–100" },
};
