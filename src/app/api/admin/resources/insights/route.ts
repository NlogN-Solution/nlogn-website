import { guard } from "@/server/middleware/guard";
import { ok } from "@/server/http";
import { getResourceInsights } from "@/server/services/resource-insights.service";

/**
 * The funnel, in counts only.
 *
 * `content:read` rather than `messages:read`: nothing here is anybody's contact
 * details — the addresses stay behind `/api/admin/resources/leads`, which is
 * gated on the inbox capability. Whoever writes the resources should be able to
 * see whether they land.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("content:read", async () => ok(await getResourceInsights()));
