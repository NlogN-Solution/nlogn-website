import { ok, readBody } from "@/server/http";
import { publicRoute } from "@/server/middleware/guard";
import { engagementTargetSchema } from "@/server/schemas/engagement";
import { toggleLike, readCounts, visitorIdFrom } from "@/server/services/engagement.service";

/**
 * Likes, or unlikes — the same call either way, so the button has one action
 * and the server decides which it was from the ledger.
 *
 * The fresh count comes back in the response, so a card that has been open in
 * another tab corrects itself instead of drifting away from the total.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = publicRoute("like", { max: 40, windowMs: 60_000 }, async (request) => {
  const { data, response } = await readBody(request, engagementTargetSchema);
  if (response) return response;

  const visitor = visitorIdFrom(request.headers);
  await toggleLike(data.kind, data.slug, visitor);

  const counts = await readCounts([{ kind: data.kind, slug: data.slug }], visitor);
  return ok(counts[`${data.kind}:${data.slug}`], {
    headers: { "Cache-Control": "private, no-store" },
  });
});
