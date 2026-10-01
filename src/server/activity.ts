import { prisma } from "@/server/db";
import type { SessionUser } from "@/server/auth";

/**
 * Audit trail.
 *
 * Logging must never be the reason a write fails, so every call is fire-and-
 * forget with its own catch. The actor's email is denormalised onto the row so
 * the history stays readable after an account is deleted.
 */

export type ActivityInput = {
  action: string;
  resource: string;
  resourceId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

export async function logActivity(user: SessionUser | null, input: ActivityInput) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: user?.id,
        userEmail: user?.email,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? undefined,
        summary: input.summary,
        metadata: input.metadata as never,
        ip: input.ip ?? undefined,
      },
    });
  } catch (error) {
    console.error("[activity] could not write log entry:", error);
  }
}
