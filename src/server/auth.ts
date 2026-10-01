import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { can, type Capability } from "@/server/permissions";
import { SESSION_COOKIE, SESSION_DAYS } from "@/config/session";
import type { AdminRole, AdminUser } from "@/generated/prisma";

/**
 * Admin authentication.
 *
 * The cookie carries an opaque random token, not a JWT. The database stores
 * only its SHA-256, so a dump of the session table cannot be replayed as a
 * login, and revoking a session (logout, disabled account, password change)
 * takes effect on the very next request — which a stateless JWT cannot do
 * without a blocklist that ends up being this table anyway.
 */

export { SESSION_COOKIE } from "@/config/session";
/** bcrypt work factor. 12 is ~250ms on current hardware — slow enough to matter. */
const BCRYPT_ROUNDS = 12;

export type SessionUser = Pick<
  AdminUser,
  "id" | "email" | "name" | "role" | "avatarUrl" | "isActive"
>;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare, so a wrong token cannot be narrowed by timing. */
export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: meta.ip ?? undefined,
      userAgent: meta.userAgent?.slice(0, 400) ?? undefined,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession
      .updateMany({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolves the signed-in admin, or null. Never throws on a missing database. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!process.env.DATABASE_URL) return null;

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    if (!session.user.isActive) return null;
    return session.user;
  } catch (error) {
    console.error("[auth] session lookup failed:", error);
    return null;
  }
}

export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export function userCan(user: SessionUser | null, capability: Capability) {
  return Boolean(user && can(user.role as AdminRole, capability));
}
