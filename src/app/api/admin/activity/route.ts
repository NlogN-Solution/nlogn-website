import { guard } from "@/server/middleware/guard";
import { ok, paginated, readListParams } from "@/server/http";
import { listActivity } from "@/server/services/stats.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("activity:read", async (_request, { url }) => {
  const params = readListParams(url, { maxPerPage: 100 });
  const { items, total } = await listActivity(params);
  return ok(paginated(items, total, params.page, params.perPage));
});
