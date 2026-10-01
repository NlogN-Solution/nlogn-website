import { prisma } from "@/server/db";
import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { deleteMedia, mediaReferences } from "@/server/services/media.service";
import { mediaUpdateSchema } from "@/server/schemas/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard<{ id: string }>("media:read", async (_request, { params }) => {
  const media = await prisma.media.findUnique({ where: { id: params.id } });
  if (!media) return errors.notFound("That file");
  return ok({ media, references: await mediaReferences(params.id) });
});

export const PATCH = guard<{ id: string }>("media:write", async (request, { params, user, ip }) => {
  const body = await readBody(request, mediaUpdateSchema);
  if (body.response) return body.response;

  const media = await prisma.media.update({
    where: { id: params.id },
    data: { alt: body.data.alt || null, caption: body.data.caption || null },
  });

  await logActivity(user, {
    action: "media.updated",
    resource: "media",
    resourceId: params.id,
    summary: `Updated metadata for ${media.originalName ?? media.publicId}`,
    ip,
  });

  return ok(media);
});

export const DELETE = guard<{ id: string }>("media:delete", async (request, { params, user, ip }) => {
  const references = await mediaReferences(params.id);
  const force = new URL(request.url).searchParams.get("force") === "true";

  // A file a published page is using is not deleted on the first ask; the admin
  // is told what would break and has to confirm.
  if (references.total > 0 && !force) {
    return errors.conflict(
      `That file is used by ${references.total} item${references.total === 1 ? "" : "s"}. Deleting it will leave them without an image.`,
    );
  }

  const media = await deleteMedia(params.id);
  if (!media) return errors.notFound("That file");

  await logActivity(user, {
    action: "media.deleted",
    resource: "media",
    resourceId: params.id,
    summary: `Deleted ${media.originalName ?? media.publicId}`,
    metadata: { references: references.total },
    ip,
  });

  return ok({ deleted: true });
});
