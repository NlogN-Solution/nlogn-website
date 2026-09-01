import { Check, X } from "lucide-react";
import { prisma } from "@/server/db";
import { cloudinaryConfigured } from "@/server/integrations/cloudinary";
import { smtpConfigured, verifySmtp } from "@/server/integrations/email";
import { PageHeader } from "@/components/admin/shell";
import { Panel, PanelHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/**
 * Integration health. Each dependency is probed rather than merely reported as
 * "configured" — an environment variable being set says nothing about whether
 * the credential behind it still works.
 */
export default async function SystemPage() {
  const database = await prisma
    .$queryRaw`SELECT 1`
    .then(() => ({ ok: true, detail: "Connected" }))
    .catch((error: unknown) => ({
      ok: false,
      detail: error instanceof Error ? error.message.slice(0, 200) : "Unreachable",
    }));

  const smtp = smtpConfigured
    ? await verifySmtp().then((r) => ({
        ok: r.ok,
        detail: r.ok ? "Connection verified" : (r.reason ?? "Failed"),
      }))
    : { ok: false, detail: "SMTP_HOST / SMTP_USER / SMTP_PASS are not set" };

  const checks = [
    { name: "Database", ...database, note: "Postgres — content, media records, messages" },
    { name: "Email (SMTP)", ...smtp, note: "Enquiry notifications and acknowledgements" },
    {
      name: "Cloudinary",
      ok: cloudinaryConfigured,
      detail: cloudinaryConfigured ? "Credentials present" : "CLOUDINARY_* are not set",
      note: "Media uploads and delivery",
    },
    {
      name: "Google Analytics",
      ok: Boolean(process.env.NEXT_PUBLIC_GA_ID),
      detail: process.env.NEXT_PUBLIC_GA_ID ? "Measurement ID configured" : "Falls back to siteConfig.gaId",
      note: "Loads only after cookie consent",
    },
    {
      name: "AI assistant",
      ok: Boolean(process.env.ANTHROPIC_API_KEY),
      detail: process.env.ANTHROPIC_API_KEY ? "API key present" : "ANTHROPIC_API_KEY is not set",
      note: "The chat widget hands off to WhatsApp without it",
    },
  ];

  return (
    <>
      <PageHeader title="System status" description="What the platform depends on, and whether it answers." />

      <Panel>
        <PanelHeader title="Integrations" description={`Environment: ${process.env.NODE_ENV}`} />
        <ul className="divide-y divide-line">
          {checks.map((check) => (
            <li key={check.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full ${
                  check.ok ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                }`}
              >
                {check.ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                <span className="block text-[0.875rem] font-medium text-ink">{check.name}</span>
                <span className="block text-[0.75rem] text-muted">{check.note}</span>
              </span>
              <span className="min-w-0 max-w-full truncate text-[0.75rem] text-muted">{check.detail}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
