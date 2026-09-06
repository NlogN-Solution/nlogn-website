import { ok, readBody } from "@/server/http";
import { publicRoute } from "@/server/middleware/guard";
import { engagementTargetSchema } from "@/server/schemas/engagement";
import { recordView, visitorIdFrom } from "@/server/services/engagement.service";

/**
 * Records that somebody read this.
 *
 * Fired from the detail page after it renders rather than counted during the
 * render, because the pages are cached: a view counted server-side would count
 * the once-per-minute regeneration, not the readers.
 *
 * Counted once per visitor per item for good — the unique index in
 * `ContentView` is the deduplication, so a refresh cannot inflate it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = publicRoute("view", { max: 60, windowMs: 60_000 }, async (request) => {
  const { data, response } = await readBody(request, engagementTargetSchema);
  if (response) return response;

  const result = await recordView(data.kind, data.slug, visitorIdFrom(request.headers));
  return ok(result, { headers: { "Cache-Control": "private, no-store" } });
});
