import { prisma } from "@/server/db";

/**
 * The resource funnel.
 *
 * Four numbers, and the gaps between them are the whole point:
 *
 *   clicks    somebody tapped the link in a reel               (ShortLink)
 *   views     the page actually rendered for them              (ContentStat)
 *   unlocks   they gave an address                             (ResourceLead)
 *   downloads they spent the grant                             (Resource)
 *
 * clicks → views is whether the link works and the page loads on a phone.
 * views → unlocks is whether the page argues well enough to be worth an email.
 * unlocks → downloads is whether delivery is actually reaching people.
 *
 * Downloads are counted per resource and not per campaign, because a grant
 * carries no campaign — attribution is recorded on the lead, and by the time a
 * token is redeemed the visitor may be on a different device entirely. Better a
 * column that is missing than one that is quietly wrong.
 */

export type ResourceRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  gate: string;
  clicks: number;
  views: number;
  unlocks: number;
  downloads: number;
};

export type CampaignRow = {
  code: string;
  platform: string | null;
  note: string | null;
  resourceTitle: string;
  resourceSlug: string;
  clicks: number;
  unlocks: number;
  lastClickAt: string | null;
};

export type ResourceInsights = {
  totals: { clicks: number; views: number; unlocks: number; downloads: number };
  resources: ResourceRow[];
  campaigns: CampaignRow[];
  /** Leads whose campaign is null — they found the library without a short link. */
  directUnlocks: number;
};

export async function getResourceInsights(): Promise<ResourceInsights> {
  const [resources, links, leadsByCampaign, clicksByResource, stats] = await Promise.all([
    prisma.resource.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        gate: true,
        unlocks: true,
        downloads: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shortLink.findMany({
      include: { resource: { select: { title: true, slug: true } } },
      orderBy: { clicks: "desc" },
    }),
    prisma.resourceLead.groupBy({ by: ["campaign"], _count: { _all: true } }),
    prisma.shortLink.groupBy({ by: ["resourceId"], _sum: { clicks: true } }),
    // Views live on the shared engagement counters, keyed by kind + slug like
    // every other content type on the site.
    prisma.contentStat.findMany({
      where: { kind: "RESOURCE" },
      select: { slug: true, views: true },
    }),
  ]);

  const unlocksByCampaign = new Map<string | null, number>(
    leadsByCampaign.map((row) => [row.campaign, row._count._all]),
  );
  const clicksById = new Map(clicksByResource.map((row) => [row.resourceId, row._sum.clicks ?? 0]));
  const viewsBySlug = new Map(stats.map((row) => [row.slug, row.views]));

  const rows: ResourceRow[] = resources.map((resource) => ({
    id: resource.id,
    slug: resource.slug,
    title: resource.title,
    status: resource.status,
    gate: resource.gate,
    clicks: clicksById.get(resource.id) ?? 0,
    views: viewsBySlug.get(resource.slug) ?? 0,
    unlocks: resource.unlocks,
    downloads: resource.downloads,
  }));

  const campaigns: CampaignRow[] = links.map((link) => ({
    code: link.code,
    platform: link.platform,
    note: link.note,
    resourceTitle: link.resource.title,
    resourceSlug: link.resource.slug,
    clicks: link.clicks,
    unlocks: unlocksByCampaign.get(link.code) ?? 0,
    lastClickAt: link.lastClickAt?.toISOString() ?? null,
  }));

  return {
    totals: {
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      views: rows.reduce((sum, row) => sum + row.views, 0),
      unlocks: rows.reduce((sum, row) => sum + row.unlocks, 0),
      downloads: rows.reduce((sum, row) => sum + row.downloads, 0),
    },
    resources: rows,
    campaigns,
    directUnlocks: unlocksByCampaign.get(null) ?? 0,
  };
}
