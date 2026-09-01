import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { capabilitiesFor } from "@/server/permissions";
import { prisma, dbRead, databaseConfigured } from "@/server/db";
import { AdminShell } from "@/components/admin/shell";
import { ToastProvider } from "@/components/admin/toast";
import type { AdminRole } from "@/generated/prisma";

/**
 * The real gate.
 *
 * Middleware only checks that a cookie exists; this resolves it against the
 * database on every request, so a revoked session or a disabled account is
 * locked out immediately rather than at cookie expiry.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "nlogn admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!databaseConfigured) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas p-6">
        <div className="max-w-md rounded-xl border border-line bg-surface p-8 text-center">
          <h1 className="font-display text-lg font-bold text-ink">The CMS is not configured</h1>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-muted">
            <code className="rounded bg-canvas px-1.5 py-0.5 text-[0.8125rem]">DATABASE_URL</code>{" "}
            is not set, so the dashboard cannot start. The public website is unaffected and is
            still serving its content.
          </p>
        </div>
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const unread = await dbRead(
    () => prisma.contactMessage.count({ where: { isRead: false } }),
    0,
    "unread count",
  );

  return (
    <ToastProvider>
      <AdminShell
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }}
        capabilities={capabilitiesFor(user.role as AdminRole)}
        unread={unread}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
