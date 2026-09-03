import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { can } from "@/server/permissions";
import { dbRead } from "@/server/db";
import { listWebsites } from "@/server/services/website.service";
import { WebsiteList } from "@/components/admin/seo/website-list";
import type { AdminRole } from "@/generated/prisma";

export const dynamic = "force-dynamic";

/**
 * The websites list — and, when there is exactly one, a straight redirect to
 * its dashboard. Nobody wants a list of one thing standing between them and
 * the report they came for.
 */
export default async function SeoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const websites = await dbRead(() => listWebsites(), [], "websites");

  if (websites.length === 1) redirect(`/admin/seo/${websites[0].id}`);

  return (
    <WebsiteList
      websites={websites.map((website) => ({
        id: website.id,
        name: website.name,
        domain: website.domain,
        gscSiteUrl: website.gscSiteUrl,
        ga4PropertyId: website.ga4PropertyId,
        isActive: website.isActive,
      }))}
      canWrite={can(user.role as AdminRole, "seo:write")}
    />
  );
}
