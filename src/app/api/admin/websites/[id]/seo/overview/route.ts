import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { seoOverview } from "@/server/services/seo-overview.service";
import { SEARCH_CONSOLE_LAG_DAYS } from "@/lib/date-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute(
  "seo:read",
  async (_request, { website, range, force }) => {
    const overview = await seoOverview(website, range, { force });
    return ok({ ...overview, range });
  },
  { lagDays: SEARCH_CONSOLE_LAG_DAYS },
);
