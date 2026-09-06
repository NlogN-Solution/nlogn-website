import { ok, errors } from "@/server/http";
import { publicRoute } from "@/server/middleware/guard";
import { keysQuerySchema } from "@/server/schemas/engagement";
import { parseEngagementKey } from "@/lib/engagement";
import { readCounts, visitorIdFrom } from "@/server/services/engagement.service";

/**
 * Counts for a batch of items, plus this visitor's own like state.
 *
 * Batched because a listing page has nine cards and nine requests would be
 * nine round-trips for three numbers each. The pages themselves are cached by
 * ISR, so these figures cannot come from the render — a count baked into a page
 * for sixty seconds is a count that looks broken the moment somebody likes
 * something.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = publicRoute("engagement", { max: 120, windowMs: 60_000 }, async (request, { url }) => {
  const parsed = keysQuerySchema.safeParse(url.searchParams.get("keys") ?? "");
  if (!parsed.success) return errors.badRequest("Ask for between 1 and 60 items.");

  const targets = parsed.data
    .map(parseEngagementKey)
    .filter((target): target is NonNullable<typeof target> => target !== null);

  const counts = await readCounts(targets, visitorIdFrom(request.headers));

  // Private: the `liked` flag is this visitor's, and a shared cache would hand
  // it to the next one.
  return ok(counts, { headers: { "Cache-Control": "private, no-store" } });
});
