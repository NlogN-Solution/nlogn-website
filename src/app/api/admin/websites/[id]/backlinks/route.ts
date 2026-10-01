import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { backlinkReport } from "@/server/services/ahrefs.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute("seo:read", async (_request, { website, force }) =>
  ok(await backlinkReport(website, { force })),
);
