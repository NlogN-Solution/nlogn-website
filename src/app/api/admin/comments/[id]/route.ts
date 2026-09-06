import { z } from "zod";
import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { deleteComment, setCommentStatus } from "@/server/services/engagement.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({ status: z.enum(["PUBLISHED", "HIDDEN", "SPAM"]) });

/**
 * Moderation, behind `messages:write`.
 *
 * Hiding is the default action and deleting is the exception: a hidden comment
 * is off the page immediately but still readable here, which is what you want
 * when the call was borderline and the person emails to ask.
 */
export const PATCH = guard<{ id: string }>("messages:write", async (request, { params, user }) => {
  const { data, response } = await readBody(request, patchSchema);
  if (response) return response;

  try {
    const updated = await setCommentStatus(params.id, data.status);
    await logActivity(user, {
      action: "comment.moderated",
      resource: "comment",
      resourceId: updated.id,
      summary: `Set ${updated.name}'s comment on ${updated.slug} to ${data.status.toLowerCase()}`,
    });
    return ok(updated);
  } catch {
    return errors.notFound("That comment");
  }
});

export const DELETE = guard<{ id: string }>("messages:write", async (_request, { params, user }) => {
  try {
    const deleted = await deleteComment(params.id);
    await logActivity(user, {
      action: "comment.deleted",
      resource: "comment",
      resourceId: deleted.id,
      summary: `Deleted ${deleted.name}'s comment on ${deleted.slug}`,
    });
    return ok({ id: deleted.id });
  } catch {
    return errors.notFound("That comment");
  }
});
