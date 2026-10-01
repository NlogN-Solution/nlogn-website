import { prisma, dbRead } from "@/server/db";
import { SETTING_GROUPS, settingsSchema, type SiteSettings } from "@/server/schemas/settings";
import { siteConfig } from "@/config/site";

/**
 * Site settings.
 *
 * Defaults come from `config/site.ts`, so the platform behaves exactly as it
 * does today before anyone opens the settings page — the database only ever
 * overrides. That also means a settings row going missing degrades to the
 * committed value rather than to an empty string on the live site.
 */

export function defaultSettings(): SiteSettings {
  return {
    siteName: siteConfig.name,
    contactEmail: siteConfig.email,
    contactPhone: siteConfig.phoneDisplay,
    whatsappNumber: siteConfig.phone.replace(/\D/g, ""),
    address: `${siteConfig.address.street}, ${siteConfig.address.city}`,
    defaultSeoTitle: "nlogn — Digital growth agency for your business",
    defaultSeoDescription: siteConfig.description,
    defaultOgImageUrl: "",
    notificationRecipients: process.env.CONTACT_TO ?? siteConfig.email,
    sendAcknowledgement: true,
    linkedin: siteConfig.socials.linkedin,
    instagram: siteConfig.socials.instagram,
    facebook: "",
    youtube: "",
    x: siteConfig.socials.x,
  };
}

/** Cached per request; settings are read on nearly every page render. */
let cache: { value: SiteSettings; at: number } | null = null;
const TTL_MS = 30_000;

export async function getSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const defaults = defaultSettings();

  const rows = await dbRead(() => prisma.siteSetting.findMany(), null, "settings");
  if (!rows) return defaults;

  const merged: Record<string, unknown> = { ...defaults };
  for (const row of rows) {
    if (row.key in defaults) merged[row.key] = row.value;
  }
  const parsed = settingsSchema.safeParse(merged);
  const value = parsed.success ? parsed.data : defaults;
  cache = { value, at: Date.now() };
  return value;
}

export async function updateSettings(patch: Partial<SiteSettings>) {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);

  // Sequential rather than one transaction: the HTTP transport has no
  // interactive transactions, and settings are independent key/value rows where
  // a partial write is recoverable by pressing Save again.
  for (const [key, value] of entries) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value: value as never,
        group: SETTING_GROUPS[key as keyof SiteSettings] ?? "general",
      },
      update: { value: value as never },
    });
  }

  cache = null;
  return getSettings();
}
