import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import {
  deleteUser,
  getUser,
  isLastActiveSuperAdmin,
  updateUser,
} from "@/server/services/user.service";
import { updateUserSchema } from "@/server/schemas/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard<{ id: string }>("users:read", async (_request, { params }) => {
  const found = await getUser(params.id);
  if (!found) return errors.notFound("That account");
  return ok(found);
});

export const PATCH = guard<{ id: string }>("users:write", async (request, { params, user, ip }) => {
  const body = await readBody(request, updateUserSchema);
  if (body.response) return body.response;

  const target = await getUser(params.id);
  if (!target) return errors.notFound("That account");

  // Nobody gets to remove the last way back in.
  const losingAdmin =
    (body.data.role && body.data.role !== "SUPER_ADMIN") || body.data.isActive === false;
  if (target.role === "SUPER_ADMIN" && losingAdmin && (await isLastActiveSuperAdmin(params.id))) {
    return errors.conflict("This is the last active super admin. Promote someone else first.");
  }

  const updated = await updateUser(params.id, body.data);

  await logActivity(user, {
    action: "user.updated",
    resource: "user",
    resourceId: params.id,
    summary: `Updated ${updated.email}${body.data.password ? " (password reset)" : ""}`,
    ip,
  });

  return ok(updated);
});

export const DELETE = guard<{ id: string }>("users:write", async (_request, { params, user, ip }) => {
  const target = await getUser(params.id);
  if (!target) return errors.notFound("That account");
  if (target.id === user.id) return errors.conflict("You cannot delete your own account.");
  if (target.role === "SUPER_ADMIN" && (await isLastActiveSuperAdmin(params.id))) {
    return errors.conflict("This is the last active super admin.");
  }

  await deleteUser(params.id);
  await logActivity(user, {
    action: "user.deleted",
    resource: "user",
    resourceId: params.id,
    summary: `Deleted ${target.email}`,
    ip,
  });

  return ok({ deleted: true });
});
