import { z } from "zod";
import { guard } from "@/server/middleware/guard";
import { errors, ok, paginated, readBody, readListParams } from "@/server/http";
import { logActivity } from "@/server/activity";
import { resolveTagIds } from "@/server/services/taxonomy.service";
import { can } from "@/server/permissions";
import {
  createArticle,
  deleteArticle,
  getArticle,
  listArticles,
  updateArticle,
  type ArticleKind,
} from "@/server/services/article.service";
import { createArticleSchema, updateArticleSchema } from "@/server/schemas/content";
import type { AdminRole } from "@/generated/prisma";

/**
 * Blogs and insights expose the same endpoints, so the handlers are built once
 * and bound to a kind. `/api/admin/blogs` and `/api/admin/insights` are two
 * exports of this factory rather than two copies of the same file.
 */

/** Tags arrive as free text from the editor and are resolved to ids here. */
const withTagNames = z.object({
  tagNames: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});

const createSchema = createArticleSchema.merge(withTagNames);
const updateSchema = updateArticleSchema.merge(withTagNames);

const label = (kind: ArticleKind) => (kind === "blog" ? "That blog" : "That insight");

export function articleCollection(kind: ArticleKind) {
  const GET = guard("content:read", async (_request, { url }) => {
    const params = readListParams(url);
    const { items, total } = await listArticles(kind, params);
    return ok(paginated(items, total, params.page, params.perPage));
  });

  const POST = guard("content:write", async (request, { user, ip }) => {
    const body = await readBody(request, createSchema);
    if (body.response) return body.response;

    // Writing a draft and putting it live are different privileges.
    if (body.data.status === "PUBLISHED" && !can(user.role as AdminRole, "content:publish")) {
      return errors.forbidden();
    }

    const tagIds = body.data.tagNames?.length
      ? await resolveTagIds(body.data.tagNames)
      : body.data.tagIds;

    const created = await createArticle(kind, { ...body.data, tagIds });

    await logActivity(user, {
      action: `${kind}.created`,
      resource: kind,
      resourceId: String(created.id),
      summary: `Created ${kind} "${body.data.title}"`,
      ip,
    });

    return ok(created, { status: 201 });
  });

  return { GET, POST };
}

export function articleItem(kind: ArticleKind) {
  const GET = guard<{ id: string }>("content:read", async (_request, { params }) => {
    const item = await getArticle(kind, params.id);
    if (!item) return errors.notFound(label(kind));
    return ok(item);
  });

  const PATCH = guard<{ id: string }>("content:write", async (request, { params, user, ip }) => {
    const body = await readBody(request, updateSchema);
    if (body.response) return body.response;

    if (body.data.status === "PUBLISHED" && !can(user.role as AdminRole, "content:publish")) {
      return errors.forbidden();
    }

    const tagIds = body.data.tagNames?.length
      ? await resolveTagIds(body.data.tagNames)
      : body.data.tagIds;

    const updated = await updateArticle(kind, params.id, { ...body.data, tagIds });
    if (!updated) return errors.notFound(label(kind));

    await logActivity(user, {
      action: body.data.status ? `${kind}.${body.data.status.toLowerCase()}` : `${kind}.updated`,
      resource: kind,
      resourceId: params.id,
      summary: `Updated ${kind} "${String(updated.title ?? params.id)}"`,
      ip,
    });

    return ok(updated);
  });

  const DELETE = guard<{ id: string }>("content:delete", async (_request, { params, user, ip }) => {
    const existing = await getArticle(kind, params.id);
    if (!existing) return errors.notFound(label(kind));

    await deleteArticle(kind, params.id);

    await logActivity(user, {
      action: `${kind}.deleted`,
      resource: kind,
      resourceId: params.id,
      summary: `Deleted ${kind} "${String(existing.title ?? params.id)}"`,
      ip,
    });

    return ok({ deleted: true });
  });

  return { GET, PATCH, DELETE };
}
