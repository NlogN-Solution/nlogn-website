import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { deleteMessage, getMessage, updateMessage } from "@/server/services/message.service";
import { messageUpdateSchema } from "@/server/schemas/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard<{ id: string }>("messages:read", async (_request, { params }) => {
  const message = await getMessage(params.id);
  if (!message) return errors.notFound("That message");

  // Opening a message marks it read; there is no separate "mark as read" click.
  if (!message.isRead) {
    await updateMessage(params.id, { isRead: true, status: message.status === "NEW" ? "READ" : undefined });
  }

  return ok(message);
});

export const PATCH = guard<{ id: string }>("messages:write", async (request, { params, user, ip }) => {
  const body = await readBody(request, messageUpdateSchema);
  if (body.response) return body.response;

  const existing = await getMessage(params.id);
  if (!existing) return errors.notFound("That message");

  const updated = await updateMessage(params.id, {
    status: body.data.status,
    isRead: body.data.isRead,
    notes: body.data.notes === undefined ? undefined : body.data.notes || null,
  });

  await logActivity(user, {
    action: `message.${body.data.status?.toLowerCase() ?? "updated"}`,
    resource: "message",
    resourceId: params.id,
    summary: `${body.data.status ?? "Updated"} message from ${existing.name}`,
    ip,
  });

  return ok(updated);
});

export const DELETE = guard<{ id: string }>("messages:write", async (_request, { params, user, ip }) => {
  const existing = await getMessage(params.id);
  if (!existing) return errors.notFound("That message");

  await deleteMessage(params.id);
  await logActivity(user, {
    action: "message.deleted",
    resource: "message",
    resourceId: params.id,
    summary: `Deleted message from ${existing.name}`,
    ip,
  });

  return ok({ deleted: true });
});
