import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { handler } from "@/server/http";
import { databaseConfigured } from "@/server/db";
import { syncAllWebsites } from "@/server/services/seo-sync.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Kept at or below 60s because that is the ceiling every Vercel plan allows
 * without Fluid Compute. `next build` does not validate this value — a budget
 * over the plan limit builds green and is then rejected while the outputs are
 * deployed, which reads as a build failure with nothing wrong in the log.
 * Raise it only alongside Fluid Compute (Pro allows 800s with it).
 */
export const maxDuration = 60;

/**
 * Scheduled synchronisation.
 *
 * Authenticated by a shared secret rather than a session, because a scheduler
 * has no cookie. Without CRON_SECRET set the endpoint refuses everything — an
 * unauthenticated route that makes dozens of outbound API calls is an
 * amplification vector, so failing closed is the only safe default.
 *
 * Vercel Cron sends the secret as `Authorization: Bearer <CRON_SECRET>`; a
 * `?key=` parameter is accepted for schedulers that cannot set headers.
 *
 * Suggested cadence — daily is right for all four. Search Console finalises
 * once a day, GA4's figures barely move within one, a Lighthouse score is noisy
 * enough that hourly runs would be measuring nothing but variance, and Ahrefs
 * is metered in units.
 *
 *   { "crons": [{ "path": "/api/cron/seo-sync", "schedule": "0 4 * * *" }] }
 */
export const GET = handler(async (request: Request) => {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_CONFIGURED", message: "CRON_SECRET is not set." } },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const presented =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key") ?? "";

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret." } },
      { status: 401 },
    );
  }

  if (!databaseConfigured) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_CONFIGURED", message: "DATABASE_URL is not set." } },
      { status: 503 },
    );
  }

  // The crawl is skipped on the scheduled run by default: it is by far the
  // slowest step and the one that touches somebody else's server, so it runs on
  // its own schedule via ?crawl=1 rather than every night by accident.
  const includeCrawl = url.searchParams.get("crawl") === "1";

  const report = await syncAllWebsites({ includeCrawl });

  return NextResponse.json({ success: true, data: { synced: report.length, report } });
});

export const POST = GET;
