import { guard } from "@/server/middleware/guard";
import { errors, ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { createUser, listUsers } from "@/server/services/user.service";
import { createUserSchema } from "@/server/schemas/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("users:read", async () => ok(await listUsers()));

export const POST = guard("users:write", async (request, { user, ip }) => {
  const body = await readBody(request, createUserSchema);
  if (body.response) return body.response;

  const result = await createUser(body.data);
  if (!result.ok) return errors.conflict(result.reason);

  await logActivity(user, {
    action: "user.created",
    resource: "user",
    resourceId: result.user.id,
    summary: `Created ${result.user.email} as ${result.user.role}`,
    ip,
  });

  return ok(result.user, { status: 201 });
});
