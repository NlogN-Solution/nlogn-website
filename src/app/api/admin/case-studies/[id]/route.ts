import { z } from "zod";
import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { can } from "@/server/permissions";
import { resolveTagIds } from "@/server/services/taxonomy.service";
import {
  deleteCaseStudy,
  getCaseStudy,
  updateCaseStudy,
} from "@/server/services/case-study.service";
import { updateCaseStudySchema } from "@/server/schemas/content";
import { revalidateCaseStudy } from "@/server/revalidate";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = updateCaseStudySchema.merge(
  z.object({ tagNames: z.array(z.string().trim().min(1).max(60)).max(20).optional() }),
);

export const GET = guard<{ id: string }>("content:read", async (_request, { params }) => {
  const item = await getCaseStudy(params.id);
  if (!item) return errors.notFound("That case study");
  return ok(item);
});

export const PATCH = guard<{ id: string }>("content:write", async (request, { params, user, ip }) => {
  const body = await readBody(request, updateSchema);
  if (body.response) return body.response;

  if (body.data.status === "PUBLISHED" && !can(user.role as AdminRole, "content:publish")) {
    return errors.forbidden();
  }

  const tagIds = body.data.tagNames?.length
    ? await resolveTagIds(body.data.tagNames)
    : body.data.tagIds;

  // Read first: a rename leaves the previous URL cached under the old slug.
  const previous = await getCaseStudy(params.id);

  const updated = await updateCaseStudy(params.id, { ...body.data, tagIds });
  if (!updated) return errors.notFound("That case study");

  revalidateCaseStudy(previous?.slug, updated.slug);

  await logActivity(user, {
    action: body.data.status ? `case-study.${body.data.status.toLowerCase()}` : "case-study.updated",
    resource: "case-study",
    resourceId: params.id,
    summary: `Updated case study "${updated.projectName}"`,
    ip,
  });

  return ok(updated);
});

export const DELETE = guard<{ id: string }>("content:delete", async (_request, { params, user, ip }) => {
  const existing = await getCaseStudy(params.id);
  if (!existing) return errors.notFound("That case study");

  await deleteCaseStudy(params.id);

  revalidateCaseStudy(existing.slug);

  await logActivity(user, {
    action: "case-study.deleted",
    resource: "case-study",
    resourceId: params.id,
    summary: `Deleted case study "${existing.projectName}"`,
    ip,
  });

  return ok({ deleted: true });
});
