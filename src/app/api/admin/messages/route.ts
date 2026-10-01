import { guard } from "@/server/middleware/guard";
import { ok, paginated, readListParams } from "@/server/http";
import { listMessages } from "@/server/services/message.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("messages:read", async (_request, { url }) => {
  const params = readListParams(url);
  const { items, total, unread } = await listMessages({
    ...params,
    source: url.searchParams.get("source") ?? undefined,
  });
  return ok({ ...paginated(items, total, params.page, params.perPage), unread });
});
