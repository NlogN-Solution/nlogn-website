import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { can } from "@/server/permissions";
import { loadWebsite } from "@/server/services/website.service";
import { IntegrationsManager } from "@/components/admin/seo/integrations";
import type { AdminRole } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Integrations", robots: { index: false } };

export default async function IntegrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ websiteId: string }>;
  searchParams: Promise<{ google?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const { websiteId } = await params;
  const website = await loadWebsite(websiteId);
  if (!website) notFound();

  // Read-only roles reach this page and see the same statuses; only the buttons
  // that change something are withheld.
  if (!can(user.role as AdminRole, "seo:read")) notFound();

  return (
    <IntegrationsManager
      websiteId={website.id}
      canConnect={can(user.role as AdminRole, "seo:connect")}
      callbackStatus={(await searchParams).google}
    />
  );
}
