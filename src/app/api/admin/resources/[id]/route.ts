import { guard } from "@/server/middleware/guard";
import { errors, fail, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { can } from "@/server/permissions";
import { resolveTagIds } from "@/server/services/taxonomy.service";
import { deleteResource, getResource, updateResource } from "@/server/services/resource.service";
import { publishBlockers, updateResourceSchema } from "@/server/schemas/resources";
import { revalidateResource } from "@/server/revalidate";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard<{ id: string }>("content:read", async (_request, { params }) => {
  const item = await getResource(params.id);
  if (!item) return errors.notFound("That resource");
  return ok(item);
});

export const PATCH = guard<{ id: string }>("content:write", async (request, { params, user, ip }) => {
  const body = await readBody(request, updateResourceSchema);
  if (body.response) return body.response;

  if (body.data.status === "PUBLISHED" && !can(user.role as AdminRole, "content:publish")) {
    return errors.forbidden();
  }

  const tagIds = body.data.tagNames?.length
    ? await resolveTagIds(body.data.tagNames)
    : body.data.tagIds;

  // Read first for two reasons: a rename leaves the previous URL cached under
  // the old slug, and the publishing rules below need the whole record.
  const previous = await getResource(params.id);
  if (!previous) return errors.notFound("That resource");

  /*
   * A PATCH is partial, so "is this publishable?" can only be asked of the
   * merged result. Asking it of the body alone would reject `{ status:
   * "PUBLISHED" }` — the most ordinary publish there is — on a resource whose
   * file was attached weeks ago.
   */
  const merged = {
    status: body.data.status ?? previous.status,
    gate: body.data.gate ?? previous.gate,
    fileMediaId: body.data.fileMediaId === undefined ? previous.fileMediaId : body.data.fileMediaId,
    externalUrl: body.data.externalUrl === undefined ? previous.externalUrl : body.data.externalUrl,
    repoUrl: body.data.repoUrl === undefined ? previous.repoUrl : body.data.repoUrl,
  };

  const blockers = publishBlockers(merged);
  if (blockers.length > 0) {
    const fields: Record<string, string> = {};
    for (const blocker of blockers) fields[blocker.path.join(".")] = blocker.message;
    return fail("VALIDATION_ERROR", "Please check the highlighted fields.", 422, { fields });
  }

  const updated = await updateResource(params.id, { ...body.data, tagIds });
  if (!updated) return errors.notFound("That resource");

  revalidateResource(previous.slug, updated.slug);

  await logActivity(user, {
    action: body.data.status ? `resource.${body.data.status.toLowerCase()}` : "resource.updated",
    resource: "resource",
    resourceId: params.id,
    summary: `Updated resource "${updated.title}"`,
    ip,
  });

  return ok(updated);
});

export const DELETE = guard<{ id: string }>("content:delete", async (_request, { params, user, ip }) => {
  const existing = await getResource(params.id);
  if (!existing) return errors.notFound("That resource");

  await deleteResource(params.id);

  revalidateResource(existing.slug);

  await logActivity(user, {
    action: "resource.deleted",
    resource: "resource",
    resourceId: params.id,
    // Worth spelling out in the trail: deleting a resource kills every short
    // link pointing at it, and those are printed in captions we cannot edit.
    summary: `Deleted resource "${existing.title}" and its ${existing.links.length} short link(s)`,
    ip,
  });

  return ok({ deleted: true });
});
