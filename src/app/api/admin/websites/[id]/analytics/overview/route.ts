import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { analyticsOverview } from "@/server/services/analytics.service";
import { ANALYTICS_LAG_DAYS } from "@/lib/date-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute(
  "seo:read",
  async (_request, { website, range, force }) => {
    const overview = await analyticsOverview(website, range, { force });
    return ok({ overview, range });
  },
  { lagDays: ANALYTICS_LAG_DAYS },
);
