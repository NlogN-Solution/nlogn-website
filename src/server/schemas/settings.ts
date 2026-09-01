import { z } from "zod";

/**
 * Site settings are a key/value store, but not a free-for-all: every key is
 * declared here with its shape and default, so a typo cannot silently create a
 * setting that nothing reads.
 */

export const settingsSchema = z.object({
  // General
  siteName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().max(40),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, "Digits only, including the country code and no plus sign.")
    .or(z.literal("")),
  address: z.string().trim().max(240),

  // SEO defaults
  defaultSeoTitle: z.string().trim().max(200),
  defaultSeoDescription: z.string().trim().max(400),
  defaultOgImageUrl: z.string().trim().url().or(z.literal("")),

  // Contact routing
  notificationRecipients: z.string().trim().max(500),
  sendAcknowledgement: z.boolean(),

  // Social
  linkedin: z.string().trim().url().or(z.literal("")),
  instagram: z.string().trim().url().or(z.literal("")),
  facebook: z.string().trim().url().or(z.literal("")),
  youtube: z.string().trim().url().or(z.literal("")),
  x: z.string().trim().url().or(z.literal("")),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

export const settingsUpdateSchema = settingsSchema.partial();

export const SETTING_GROUPS: Record<keyof SiteSettings, string> = {
  siteName: "general",
  contactEmail: "general",
  contactPhone: "general",
  whatsappNumber: "contact",
  address: "general",
  defaultSeoTitle: "seo",
  defaultSeoDescription: "seo",
  defaultOgImageUrl: "seo",
  notificationRecipients: "contact",
  sendAcknowledgement: "contact",
  linkedin: "social",
  instagram: "social",
  facebook: "social",
  youtube: "social",
  x: "social",
};
