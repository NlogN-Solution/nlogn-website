import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/server/auth";
import { can, type Capability } from "@/server/permissions";
import { errors, handler } from "@/server/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { databaseConfigured } from "@/server/db";
import type { AdminRole } from "@/generated/prisma";

/**
 * The single gate every admin endpoint passes through.
 *
 * Authorisation is checked here rather than in each handler, so a new route
 * cannot ship without one — forgetting `guard` means the file has no exported
 * handler at all, which fails loudly instead of silently serving data.
 */

export type GuardedContext<P = Record<string, string>> = {
  user: SessionUser;
  params: P;
  url: URL;
  ip: string;
};

export function guard<P = Record<string, string>>(
  capability: Capability,
  fn: (request: Request, ctx: GuardedContext<P>) => Promise<NextResponse>,
) {
  return handler(async (request: Request, routeCtx?: { params: Promise<P> }) => {
    if (!databaseConfigured) {
      return errors.badRequest("The CMS is not configured: DATABASE_URL is missing.");
    }

    const user = await getSessionUser();
    if (!user) return errors.unauthorized();
    if (!can(user.role as AdminRole, capability)) return errors.forbidden();

    const params = ((await routeCtx?.params) ?? {}) as P;
    return fn(request, {
      user,
      params,
      url: new URL(request.url),
      ip: clientIp(request.headers),
    });
  });
}

/**
 * Public endpoints: no session, but a per-IP budget. The window is generous
 * enough for a person filling in a form twice and tight enough to make a script
 * pointless.
 */
export function publicRoute(
  key: string,
  limit: { max: number; windowMs: number },
  fn: (request: Request, ctx: { ip: string; url: URL }) => Promise<NextResponse>,
) {
  return handler(async (request: Request) => {
    const ip = clientIp(request.headers);
    const result = rateLimit(`${key}:${ip}`, limit.max, limit.windowMs);
    if (!result.ok) {
      return errors.tooMany(Math.ceil((result.resetAt - Date.now()) / 1000));
    }
    return fn(request, { ip, url: new URL(request.url) });
  });
}
