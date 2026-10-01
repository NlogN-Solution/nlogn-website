import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { performanceReport } from "@/server/services/pagespeed.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute("seo:read", async (_request, { website }) =>
  ok(await performanceReport(website)),
);
