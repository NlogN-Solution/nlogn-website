import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { searchConsoleBreakdowns, searchConsoleOverview } from "@/server/services/search-console.service";
import { SEARCH_CONSOLE_LAG_DAYS } from "@/lib/date-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute(
  "seo:read",
  async (_request, { website, range, force }) => {
    const [overview, breakdowns] = await Promise.all([
      searchConsoleOverview(website, range, { force }),
      searchConsoleBreakdowns(website, range, { force }),
    ]);

    return ok({ overview, breakdowns, range });
  },
  { lagDays: SEARCH_CONSOLE_LAG_DAYS },
);
