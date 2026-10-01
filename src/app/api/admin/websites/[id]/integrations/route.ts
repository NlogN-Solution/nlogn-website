import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { listConnections, toPublicConnection } from "@/server/services/seo-connection.service";
import { encryptionConfigured } from "@/server/crypto";
import { googleOAuthConfigured } from "@/server/integrations/google-oauth";
import { pageSpeedConfigured } from "@/server/integrations/pagespeed";
import { AHREFS_UNAVAILABLE_REASON, ahrefsConfigured } from "@/server/integrations/ahrefs";
import { prisma } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The integrations page's data.
 *
 * Reports what is *configured on the server* alongside what is *connected for
 * this website*, because those fail differently and the fix is different: a
 * missing environment variable is a deploy change, a missing connection is a
 * button click.
 */
export const GET = websiteRoute("seo:read", async (_request, { website }) => {
  const [connections, lastCrawl] = await Promise.all([
    listConnections(website.id),
    prisma.crawlRun.findFirst({
      where: { websiteId: website.id },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true, finishedAt: true, status: true, pagesCrawled: true },
    }),
  ]);

  return ok({
    connections: connections.map(toPublicConnection),
    website: {
      id: website.id,
      name: website.name,
      domain: website.domain,
      ga4PropertyId: website.ga4PropertyId,
      gscSiteUrl: website.gscSiteUrl,
    },
    server: {
      googleOAuth: googleOAuthConfigured(),
      encryption: encryptionConfigured(),
      pageSpeed: pageSpeedConfigured(),
      ahrefs: ahrefsConfigured(),
      ahrefsNote: ahrefsConfigured() ? null : AHREFS_UNAVAILABLE_REASON,
    },
    crawler: lastCrawl
      ? {
          startedAt: lastCrawl.startedAt.toISOString(),
          finishedAt: lastCrawl.finishedAt?.toISOString() ?? null,
          status: lastCrawl.status,
          pagesCrawled: lastCrawl.pagesCrawled,
        }
      : null,
  });
});
