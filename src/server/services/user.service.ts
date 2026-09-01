import { prisma, dbRead } from "@/server/db";
import { hashPassword } from "@/server/auth";
import type { AdminRole } from "@/generated/prisma";

/** Admin accounts. Password hashes never leave this module. */

const safeSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export function listUsers() {
  return prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: safeSelect });
}

export function getUser(id: string) {
  return prisma.adminUser.findUnique({ where: { id }, select: safeSelect });
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}) {
  const existing = await prisma.adminUser.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) return { ok: false as const, reason: "An account with that email already exists." };

  const user = await prisma.adminUser.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    },
    select: safeSelect,
  });

  return { ok: true as const, user };
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: AdminRole; isActive?: boolean; password?: string },
) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.password) data.passwordHash = await hashPassword(input.password);

  const user = await prisma.adminUser.update({ where: { id }, data, select: safeSelect });

  // Changing a password or disabling an account must end that person's other
  // sessions immediately, not at the next cookie expiry.
  if (input.password || input.isActive === false) {
    await prisma.adminSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return user;
}

/** Guards against locking everyone out by demoting or disabling the last admin. */
export async function isLastActiveSuperAdmin(id: string) {
  const count = await prisma.adminUser.count({
    where: { role: "SUPER_ADMIN", isActive: true, NOT: { id } },
  });
  return count === 0;
}

export function deleteUser(id: string) {
  return prisma.adminUser.delete({ where: { id } });
}

/** Rendered on the login page, so it must never throw or hang. */
export function countAdmins() {
  return dbRead(() => prisma.adminUser.count(), 0, "admin count");
}
