import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { googleAccessToken } from "@/server/services/seo-connection.service";
import { TTL, cached } from "@/server/services/seo-cache.service";
import { listSites } from "@/server/integrations/search-console";
import { listProperties } from "@/server/integrations/ga4";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What this Google account can report on, so the admin picks a property from a
 * list instead of hunting for a numeric ID in the Analytics interface.
 *
 * Both lists come back together: one consent granted both scopes, so failing to
 * offer both would send somebody back to Google for no reason.
 */
export const GET = websiteRoute("seo:write", async (_request, { website, force }) => {
  const accessToken = await googleAccessToken(website.id);

  if (!accessToken) {
    return ok({
      connected: false,
      reason: "Connect a Google account before choosing properties.",
      searchConsole: [],
      analytics: [],
    });
  }

  const result = await cached(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    "google:properties",
    TTL.properties,
    async () => {
      // Settled independently: an account with Search Console access but no
      // Analytics access should still get its Search Console list.
      const [searchConsole, analytics] = await Promise.allSettled([
        listSites(accessToken),
        listProperties(accessToken),
      ]);

      return {
        searchConsole: searchConsole.status === "fulfilled" ? searchConsole.value : [],
        analytics: analytics.status === "fulfilled" ? analytics.value : [],
        searchConsoleError:
          searchConsole.status === "rejected" ? "Search Console properties could not be listed." : null,
        analyticsError:
          analytics.status === "rejected" ? "Analytics properties could not be listed." : null,
      };
    },
    { force },
  );

  return ok({ connected: true, ...result.data, fetchedAt: result.fetchedAt.toISOString() });
});
