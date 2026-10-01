import { guard } from "@/server/middleware/guard";
import { errors, ok, paginated, readListParams } from "@/server/http";
import { logActivity } from "@/server/activity";
import { listMedia, saveUpload } from "@/server/services/media.service";
import { cloudinaryConfigured, MEDIA_FOLDERS, type MediaFolder } from "@/server/integrations/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Video uploads take a while to reach Cloudinary. */
export const maxDuration = 60;

export const GET = guard("media:read", async (_request, { url }) => {
  const params = readListParams(url, { maxPerPage: 60 });
  const { items, total } = await listMedia({
    ...params,
    type: url.searchParams.get("type") ?? undefined,
    folder: url.searchParams.get("folder") ?? undefined,
  });
  return ok(paginated(items, total, params.page, params.perPage));
});

export const POST = guard("media:write", async (request, { user, ip }) => {
  if (!cloudinaryConfigured) {
    return errors.badRequest("Cloudinary is not configured, so uploads are disabled.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errors.badRequest("That upload could not be read.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return errors.badRequest("No file was attached.");

  const folderRaw = String(form.get("folder") ?? "general");
  const folder = (MEDIA_FOLDERS as readonly string[]).includes(folderRaw)
    ? (folderRaw as MediaFolder)
    : "general";

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await saveUpload({
    buffer,
    mimeType: file.type,
    size: buffer.byteLength,
    originalName: file.name || "upload",
    folder,
    uploadedById: user.id,
  });

  if (!result.ok) return errors.badRequest(result.reason);

  await logActivity(user, {
    action: "media.uploaded",
    resource: "media",
    resourceId: result.media.id,
    summary: `Uploaded ${result.media.originalName ?? result.media.publicId}`,
    metadata: { bytes: result.media.bytes, type: result.media.type },
    ip,
  });

  return ok(result.media, { status: 201 });
});
