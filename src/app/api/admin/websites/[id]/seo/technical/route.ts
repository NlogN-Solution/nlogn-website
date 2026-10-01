import { ok } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { technicalReport } from "@/server/services/seo-technical.service";
import { SEVERITY_BLURB, SEVERITY_LABELS } from "@/config/seo-issues";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute("seo:read", async (_request, { website }) => {
  const report = await technicalReport(website.id);
  return ok({ ...report, severityLabels: SEVERITY_LABELS, severityBlurb: SEVERITY_BLURB });
});
