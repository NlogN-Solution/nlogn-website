import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { googleAccessToken } from "@/server/services/seo-connection.service";
import { TTL, readCache, writeCache } from "@/server/services/seo-cache.service";
import { listSites } from "@/server/integrations/search-console";
import { listProperties } from "@/server/integrations/ga4";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "google:properties";

/**
 * A failed lookup must not be cached for as long as a good one.
 *
 * An empty list and a list that could not be fetched look identical once
 * stored, so holding a failure for the full TTL hides a property for half a day
 * after somebody verifies it — which is exactly what an expiring refresh token
 * or a just-verified DNS record produces.
 */
const ERROR_TTL = 60;

type Payload = {
  searchConsole: Awaited<ReturnType<typeof listSites>>;
  analytics: Awaited<ReturnType<typeof listProperties>>;
  searchConsoleError: string | null;
  analyticsError: string | null;
};

/** Google's own message ("Token has been expired or revoked") is the useful part. */
function reasonOf(result: PromiseRejectedResult, subject: string) {
  const { reason } = result;
  const detail = reason instanceof Error ? reason.message : String(reason);
  return `${subject} could not be listed: ${detail}`;
}

/**
 * What this Google account can report on, so the admin picks a property from a
 * list instead of hunting for a numeric ID in the Analytics interface.
 *
 * Both lists come back together: one consent granted both scopes, so failing to
 * offer both would send somebody back to Google for no reason.
 *
 * This reads through the cache by hand rather than using `cached`, because the
 * TTL depends on what came back — see ERROR_TTL.
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

  if (!force) {
    const fresh = await readCache<Payload>(website.id, KEY);
    if (fresh) {
      return ok({ connected: true, ...fresh.data, fetchedAt: fresh.fetchedAt.toISOString() });
    }
  }

  // Settled independently: an account with Search Console access but no
  // Analytics access should still get its Search Console list.
  const [searchConsole, analytics] = await Promise.allSettled([
    listSites(accessToken),
    listProperties(accessToken),
  ]);

  const payload: Payload = {
    searchConsole: searchConsole.status === "fulfilled" ? searchConsole.value : [],
    analytics: analytics.status === "fulfilled" ? analytics.value : [],
    searchConsoleError:
      searchConsole.status === "rejected" ? reasonOf(searchConsole, "Search Console properties") : null,
    analyticsError:
      analytics.status === "rejected" ? reasonOf(analytics, "Analytics properties") : null,
  };

  const failed = Boolean(payload.searchConsoleError || payload.analyticsError);
  const fetchedAt = new Date();

  await writeCache(
    website.id,
    "GOOGLE_SEARCH_CONSOLE",
    KEY,
    payload,
    failed ? ERROR_TTL : TTL.properties,
  );

  return ok({ connected: true, ...payload, fetchedAt: fetchedAt.toISOString() });
});
