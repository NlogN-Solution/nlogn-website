import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { prisma } from "@/server/db";
import { createShortLink } from "@/server/services/resource-access.service";
import { shortLinkSchema } from "@/server/schemas/resources";

/**
 * Short links for one resource — one per reel, so the funnel can be read per
 * video rather than in aggregate.
 *
 * There is no DELETE on purpose. A link that has been spoken aloud in a video
 * cannot be recalled, and deleting the row turns a working URL into a dead one
 * for as long as that video is up. Point it somewhere useful instead.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard<{ id: string }>("content:read", async (_request, { params }) => {
  const links = await prisma.shortLink.findMany({
    where: { resourceId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return ok(links);
});

export const POST = guard<{ id: string }>("content:write", async (request, { params, user, ip }) => {
  const body = await readBody(request, shortLinkSchema);
  if (body.response) return body.response;

  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
    select: { id: true, title: true },
  });
  if (!resource) return errors.notFound("That resource");

  const result = await createShortLink(resource.id, {
    code: body.data.code,
    platform: body.data.platform,
    note: body.data.note,
  });

  if (!result.ok) return errors.conflict(result.reason);

  await logActivity(user, {
    action: "resource.link-created",
    resource: "resource",
    resourceId: resource.id,
    summary: `Created /r/${result.link.code} for "${resource.title}"`,
    ip,
  });

  return ok(result.link, { status: 201 });
});
