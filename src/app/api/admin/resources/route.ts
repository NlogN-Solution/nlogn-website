import { guard } from "@/server/middleware/guard";
import { errors, ok, paginated, readBody, readListParams } from "@/server/http";
import { logActivity } from "@/server/activity";
import { can } from "@/server/permissions";
import { resolveTagIds } from "@/server/services/taxonomy.service";
import { createResource, listResources } from "@/server/services/resource.service";
import { createResourceSchema } from "@/server/schemas/resources";
import { revalidateResource } from "@/server/revalidate";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("content:read", async (_request, { url }) => {
  const params = readListParams(url);
  const { items, total } = await listResources(params);
  return ok(paginated(items, total, params.page, params.perPage));
});

export const POST = guard("content:write", async (request, { user, ip }) => {
  const body = await readBody(request, createResourceSchema);
  if (body.response) return body.response;

  if (body.data.status === "PUBLISHED" && !can(user.role as AdminRole, "content:publish")) {
    return errors.forbidden();
  }

  const tagIds = body.data.tagNames?.length
    ? await resolveTagIds(body.data.tagNames)
    : body.data.tagIds;

  const created = await createResource({ ...body.data, tagIds });

  revalidateResource(created.slug);

  await logActivity(user, {
    action: "resource.created",
    resource: "resource",
    resourceId: created.id,
    summary: `Created resource "${created.title}"`,
    ip,
  });

  return ok(created, { status: 201 });
});
