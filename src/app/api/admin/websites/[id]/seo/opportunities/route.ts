import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { searchConsolePages, searchConsoleQueries } from "@/server/services/search-console.service";
import { OPPORTUNITY_LABELS, findOpportunities } from "@/server/services/seo-opportunities.service";
import { SEARCH_CONSOLE_LAG_DAYS } from "@/lib/date-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute(
  "seo:read",
  async (_request, { website, range, force }) => {
    const [queries, pages] = await Promise.all([
      searchConsoleQueries(website, range, { force }),
      searchConsolePages(website, range, { force }),
    ]);

    if (!queries.connected) {
      return ok({ connected: false, reason: queries.reason });
    }

    const { opportunities, benchmarkAvailable } = findOpportunities(
      queries.data.rows,
      pages.connected ? pages.data.rows : [],
    );

    return ok({
      connected: true,
      fetchedAt: queries.fetchedAt,
      stale: queries.stale,
      range,
      opportunities,
      labels: OPPORTUNITY_LABELS,
      // False on a site with too few keywords to establish its own CTR
      // baseline; the UI says so rather than showing fewer opportunities
      // without explanation.
      benchmarkAvailable,
    });
  },
  { lagDays: SEARCH_CONSOLE_LAG_DAYS },
);
