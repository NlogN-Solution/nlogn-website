import { guard } from "@/server/middleware/guard";
import { ok, paginated, readListParams } from "@/server/http";
import { listCommentsForAdmin } from "@/server/services/engagement.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("messages:read", async (_request, { url }) => {
  const params = readListParams(url);
  const { items, total, pending } = await listCommentsForAdmin({
    ...params,
    kind: url.searchParams.get("kind") ?? undefined,
  });
  return ok({ ...paginated(items, total, params.page, params.perPage), pending });
});
