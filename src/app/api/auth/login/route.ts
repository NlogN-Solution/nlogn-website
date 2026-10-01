import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSession, verifyPassword } from "@/server/auth";
import { loginSchema } from "@/server/schemas/auth";
import { logActivity } from "@/server/activity";
import { errors, ok, readBody, handler } from "@/server/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { capabilitiesFor } from "@/server/permissions";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sign in.
 *
 * A wrong email and a wrong password return the same message and take the same
 * path — the bcrypt comparison runs against a dummy hash for an unknown
 * account, so response timing does not reveal which addresses exist.
 */

/** bcrypt hash of a random string; only ever used to burn the same time. */
const DUMMY_HASH = "$2b$12$WVI7OrlyNiaU7F5dUFUPaOV1CcLRWRox26GohnxOr6/r4DulZ0/Mm";

export const POST = handler(async (request: Request) => {
  const ip = clientIp(request.headers);

  // Five attempts per fifteen minutes: enough for a typo, useless for a
  // dictionary run.
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60_000);
  if (!limit.ok) return errors.tooMany(Math.ceil((limit.resetAt - Date.now()) / 1000));

  const body = await readBody(request, loginSchema);
  if (body.response) return body.response;

  const { email, password } = body.data;

  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid || !user.isActive) {
    await logActivity(null, {
      action: "login.failed",
      resource: "auth",
      summary: `Failed sign-in for ${email}`,
      ip,
    });
    return errors.unauthorized();
  }

  await createSession(user.id, { ip, userAgent: request.headers.get("user-agent") });
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await logActivity(user, {
    action: "login",
    resource: "auth",
    summary: `${user.email} signed in`,
    ip,
  });

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    capabilities: capabilitiesFor(user.role as AdminRole),
  });
});

export const GET = async () => NextResponse.json({ success: false }, { status: 405 });
