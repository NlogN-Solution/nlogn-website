import { NextResponse } from "next/server";
import { guard } from "@/server/middleware/guard";
import { errors } from "@/server/http";
import { logActivity } from "@/server/activity";
import { loadWebsite } from "@/server/services/website.service";
import { disconnect } from "@/server/services/seo-connection.service";
import { syncProviderSchema } from "@/server/schemas/seo";
import type { SeoProvider } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Disconnect a provider.
 *
 * `seo:connect`, matching the capability that established it — being able to
 * trigger a sync should not also let somebody revoke the credential.
 *
 * For Google this revokes the token at Google's end as well as deleting our
 * copy, so the grant disappears from the account's third-party access list
 * rather than merely being forgotten here.
 */
export const DELETE = guard<{ id: string; provider: string }>(
  "seo:connect",
  async (_request, { params, user, ip }) => {
    const parsed = syncProviderSchema.safeParse(params.provider.toUpperCase().replace(/-/g, "_"));
    if (!parsed.success || parsed.data === "CRAWLER") {
      return errors.badRequest("That is not a provider that can be disconnected.");
    }

    const website = await loadWebsite(params.id);
    if (!website) return errors.notFound("That website");

    await disconnect(website.id, parsed.data as SeoProvider);

    // Disconnecting Google Search Console removes the shared credential, so the
    // Analytics row would otherwise be left claiming a connection it cannot use.
    if (parsed.data === "GOOGLE_SEARCH_CONSOLE") {
      await disconnect(website.id, "GOOGLE_ANALYTICS").catch(() => undefined);
    }

    await logActivity(user, {
      action: "seo.disconnected",
      resource: "website",
      resourceId: website.id,
      summary: `Disconnected ${parsed.data.replace(/_/g, " ").toLowerCase()} from ${website.domain}`,
      ip,
    });

    return NextResponse.json({ success: true, data: { disconnected: true } });
  },
);
