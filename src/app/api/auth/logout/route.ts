import { destroySession, getSessionUser } from "@/server/auth";
import { logActivity } from "@/server/activity";
import { ok, handler } from "@/server/http";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (request: Request) => {
  const user = await getSessionUser();
  await destroySession();
  if (user) {
    await logActivity(user, {
      action: "logout",
      resource: "auth",
      summary: `${user.email} signed out`,
      ip: clientIp(request.headers),
    });
  }
  return ok({ signedOut: true });
});
