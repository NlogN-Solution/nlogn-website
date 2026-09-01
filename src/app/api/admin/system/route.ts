import { guard } from "@/server/middleware/guard";
import { ok } from "@/server/http";
import { prisma } from "@/server/db";
import { cloudinaryConfigured } from "@/server/integrations/cloudinary";
import { smtpConfigured, verifySmtp } from "@/server/integrations/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * System status. Each integration is probed rather than merely reported as
 * "configured" — an env var being set says nothing about whether the credential
 * still works.
 */
export const GET = guard("settings:read", async () => {
  const database = await prisma
    .$queryRaw`SELECT 1`
    .then(() => ({ ok: true as const }))
    .catch((error: unknown) => ({
      ok: false as const,
      reason: error instanceof Error ? error.message : "Unreachable",
    }));

  const smtp = smtpConfigured
    ? await verifySmtp()
    : { ok: false as const, reason: "SMTP is not configured." };

  return ok({
    database,
    smtp,
    cloudinary: cloudinaryConfigured
      ? { ok: true as const }
      : { ok: false as const, reason: "Cloudinary is not configured." },
    analytics: { ok: Boolean(process.env.NEXT_PUBLIC_GA_ID) },
    ai: { ok: Boolean(process.env.ANTHROPIC_API_KEY) },
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version ?? "0.1.0",
  });
});
