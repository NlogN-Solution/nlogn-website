import { guard } from "@/server/middleware/guard";
import { ok, errors, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { BlockedUrlError } from "@/server/net-guard";
import {
  createWebsite,
  listWebsites,
  toSummary,
  websiteExistsForDomain,
} from "@/server/services/website.service";
import { websiteCreateSchema } from "@/server/schemas/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("seo:read", async () => {
  const websites = await listWebsites();
  return ok({ items: websites.map(toSummary) });
});

export const POST = guard("seo:write", async (request, { user, ip }) => {
  const body = await readBody(request, websiteCreateSchema);
  if (body.response) return body.response;

  const existing = await websiteExistsForDomain(body.data.domain);
  if (existing) return errors.conflict("That domain is already being tracked.");

  try {
    const website = await createWebsite({
      name: body.data.name,
      domain: body.data.domain,
      ga4PropertyId: body.data.ga4PropertyId || null,
      gscSiteUrl: body.data.gscSiteUrl || null,
      ahrefsDomain: body.data.ahrefsDomain || null,
    });

    await logActivity(user, {
      action: "website.created",
      resource: "website",
      resourceId: website.id,
      summary: `Added ${website.domain}`,
      ip,
    });

    return ok(toSummary(website), { status: 201 });
  } catch (error) {
    // A domain that resolves somewhere private is a validation failure, not a
    // server error — and the message says exactly what was refused.
    if (error instanceof BlockedUrlError) return errors.badRequest(error.message);
    throw error;
  }
});
