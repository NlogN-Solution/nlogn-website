import { ok, errors, readBody } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { logActivity } from "@/server/activity";
import { BlockedUrlError } from "@/server/net-guard";
import { deleteWebsite, toSummary, updateWebsite } from "@/server/services/website.service";
import { listConnections, toPublicConnection } from "@/server/services/seo-connection.service";
import { websiteUpdateSchema } from "@/server/schemas/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute("seo:read", async (_request, { website }) => {
  const connections = await listConnections(website.id);
  return ok({
    website: toSummary(website),
    // `toPublicConnection` is what keeps tokens out of this response.
    connections: connections.map(toPublicConnection),
  });
});

export const PATCH = websiteRoute("seo:write", async (request, { website, user, ip }) => {
  const body = await readBody(request, websiteUpdateSchema);
  if (body.response) return body.response;

  try {
    const updated = await updateWebsite(website.id, {
      ...body.data,
      ga4PropertyId: body.data.ga4PropertyId === "" ? null : body.data.ga4PropertyId,
      gscSiteUrl: body.data.gscSiteUrl === "" ? null : body.data.gscSiteUrl,
    });

    await logActivity(user, {
      action: "website.updated",
      resource: "website",
      resourceId: website.id,
      summary: `Updated ${updated.domain}`,
      ip,
    });

    return ok(toSummary(updated));
  } catch (error) {
    if (error instanceof BlockedUrlError) return errors.badRequest(error.message);
    throw error;
  }
});

export const DELETE = websiteRoute("seo:write", async (_request, { website, user, ip }) => {
  await deleteWebsite(website.id);

  await logActivity(user, {
    action: "website.deleted",
    resource: "website",
    resourceId: website.id,
    summary: `Removed ${website.domain} and all its SEO data`,
    ip,
  });

  return ok({ deleted: true });
});
