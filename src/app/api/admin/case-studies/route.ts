import { z } from "zod";
import { guard } from "@/server/middleware/guard";
import { errors, ok, paginated, readBody, readListParams } from "@/server/http";
import { logActivity } from "@/server/activity";
import { can } from "@/server/permissions";
import { resolveTagIds } from "@/server/services/taxonomy.service";
import { createCaseStudy, listCaseStudies } from "@/server/services/case-study.service";
import { createCaseStudySchema } from "@/server/schemas/content";
import { revalidateCaseStudy } from "@/server/revalidate";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = createCaseStudySchema.merge(
  z.object({ tagNames: z.array(z.string().trim().min(1).max(60)).max(20).optional() }),
);

export const GET = guard("content:read", async (_request, { url }) => {
  const params = readListParams(url);
  const { items, total } = await listCaseStudies(params);
  return ok(paginated(items, total, params.page, params.perPage));
});

export const POST = guard("content:write", async (request, { user, ip }) => {
  const body = await readBody(request, createSchema);
  if (body.response) return body.response;

  if (body.data.status === "PUBLISHED" && !can(user.role as AdminRole, "content:publish")) {
    return errors.forbidden();
  }

  const tagIds = body.data.tagNames?.length
    ? await resolveTagIds(body.data.tagNames)
    : body.data.tagIds;

  const created = await createCaseStudy({ ...body.data, tagIds });

  revalidateCaseStudy(created.slug);

  await logActivity(user, {
    action: "case-study.created",
    resource: "case-study",
    resourceId: created.id,
    summary: `Created case study "${created.projectName}"`,
    ip,
  });

  return ok(created, { status: 201 });
});
