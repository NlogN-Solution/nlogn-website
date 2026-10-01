import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { can } from "@/server/permissions";
import { dbRead } from "@/server/db";
import { listWebsites, loadWebsite } from "@/server/services/website.service";
import { SeoDashboard } from "@/components/admin/seo/dashboard";
import type { AdminRole } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ websiteId: string }> }) {
  const website = await loadWebsite((await params).websiteId);
  return { title: website ? `${website.name} — SEO` : "SEO", robots: { index: false } };
}

export default async function SeoDashboardPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const { websiteId } = await params;
  const website = await loadWebsite(websiteId);
  if (!website) notFound();

  const websites = await dbRead(() => listWebsites(), [], "websites");

  return (
    <SeoDashboard
      website={{
        id: website.id,
        name: website.name,
        domain: website.domain,
        gscSiteUrl: website.gscSiteUrl,
        ga4PropertyId: website.ga4PropertyId,
      }}
      websites={websites.map((item) => ({ id: item.id, name: item.name, domain: item.domain }))}
      canWrite={can(user.role as AdminRole, "seo:write")}
    />
  );
}
