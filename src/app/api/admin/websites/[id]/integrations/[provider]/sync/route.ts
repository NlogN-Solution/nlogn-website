import { guard } from "@/server/middleware/guard";
import { errors, ok } from "@/server/http";
import { logActivity } from "@/server/activity";
import { rateLimit } from "@/lib/rate-limit";
import { loadWebsite } from "@/server/services/website.service";
import { syncProvider, syncWebsite } from "@/server/services/seo-sync.service";
import { syncProviderSchema } from "@/server/schemas/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A crawl plus two Lighthouse runs comfortably exceeds the default budget. */
export const maxDuration = 300;

/**
 * "Sync now".
 *
 * Rate limited per user per website, because every provider behind this button
 * is metered — Search Console by quota, Ahrefs by units, PageSpeed by requests
 * a minute, and the crawler by somebody else's server capacity. Three runs in
 * ten minutes is plenty for a person checking whether a fix took effect.
 *
 * `all` runs every provider including the crawl; a named provider runs one.
 */
export const POST = guard<{ id: string; provider: string }>(
  "seo:write",
  async (_request, { params, user, ip }) => {
    const website = await loadWebsite(params.id);
    if (!website) return errors.notFound("That website");

    const budget = rateLimit(`seo-sync:${user.id}:${website.id}`, 3, 10 * 60_000);
    if (!budget.ok) return errors.tooMany(Math.ceil((budget.resetAt - Date.now()) / 1000));

    const raw = params.provider.toUpperCase().replace(/-/g, "_");

    if (raw === "ALL") {
      const results = await syncWebsite(website);

      await logActivity(user, {
        action: "seo.synced",
        resource: "website",
        resourceId: website.id,
        summary: `Synced everything for ${website.domain}`,
        ip,
      });

      return ok({ results });
    }

    const parsed = syncProviderSchema.safeParse(raw);
    if (!parsed.success) return errors.badRequest("That is not a provider that can be synced.");

    const result = await syncProvider(website, parsed.data);

    await logActivity(user, {
      action: "seo.synced",
      resource: "website",
      resourceId: website.id,
      summary: `Synced ${parsed.data.replace(/_/g, " ").toLowerCase()} for ${website.domain}`,
      ip,
    });

    return ok({ results: [result] });
  },
);
