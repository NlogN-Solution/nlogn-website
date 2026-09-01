import { getSessionUser } from "@/server/auth";
import { capabilitiesFor } from "@/server/permissions";
import { errors, ok, handler } from "@/server/http";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await getSessionUser();
  if (!user) return errors.unauthorized();
  return ok({ user, capabilities: capabilitiesFor(user.role as AdminRole) });
});
