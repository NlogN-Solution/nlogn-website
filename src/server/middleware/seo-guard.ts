import { NextResponse } from "next/server";
import { guard, type GuardedContext } from "@/server/middleware/guard";
import { errors } from "@/server/http";
import { loadWebsite } from "@/server/services/website.service";
import { parseRange } from "@/lib/date-range";
import { rateLimit } from "@/lib/rate-limit";
import type { Capability } from "@/server/permissions";
import type { ComparedRange } from "@/lib/date-range";
import type { Website } from "@/generated/prisma";

/**
 * `guard`, plus the website the route is about.
 *
 * The point is that no handler ever reads `params.id` itself. It arrives as a
 * loaded `Website` record or the request has already been answered with a 404 —
 * so "verify ownership before using a frontend-supplied id" is structural here
 * rather than something each new endpoint has to remember.
 *
 * The capability check still happens in `guard`; this adds resolution, the
 * shared date range, and an optional per-user budget for the expensive routes.
 */

export type WebsiteContext = GuardedContext<{ id: string }> & {
  website: Website;
  range: ComparedRange;
  /** `?refresh=1` — bypasses the cache. Rate limited by the caller. */
  force: boolean;
};

export function websiteRoute(
  capability: Capability,
  fn: (request: Request, ctx: WebsiteContext) => Promise<NextResponse>,
  options: { lagDays?: number; limit?: { max: number; windowMs: number; key: string } } = {},
) {
  return guard<{ id: string }>(capability, async (request, ctx) => {
    const website = await loadWebsite(ctx.params.id);
    if (!website) return errors.notFound("That website");

    if (options.limit) {
      // Keyed by user and website, not by IP: several admins behind one office
      // address should not share a crawl budget.
      const result = rateLimit(
        `${options.limit.key}:${ctx.user.id}:${website.id}`,
        options.limit.max,
        options.limit.windowMs,
      );

      if (!result.ok) return errors.tooMany(Math.ceil((result.resetAt - Date.now()) / 1000));
    }

    return fn(request, {
      ...ctx,
      website,
      range: parseRange(ctx.url.searchParams, { lagDays: options.lagDays ?? 0 }),
      force: ctx.url.searchParams.get("refresh") === "1",
    });
  });
}
