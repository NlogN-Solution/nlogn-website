import { NextResponse } from "next/server";
import { databaseConfigured } from "@/server/db";
import { handler } from "@/server/http";
import { redeemGrant } from "@/server/services/resource-access.service";
import { deliver } from "@/server/resource-download";

/**
 * Spending a grant.
 *
 * Deliberately not a JSON endpoint: this URL is clicked from an email and typed
 * into a browser, so a failure has to be readable by a person rather than by a
 * fetch handler. Each reason redirects back to the library with a query the
 * page turns into a sentence — "that link has expired", and a way to get a new
 * one — instead of a bare 410 in an empty tab.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  unknown: "unknown",
  expired: "expired",
  exhausted: "used-up",
  unavailable: "withdrawn",
};

export const GET = handler(
  async (request: Request, ctx?: { params: Promise<{ token: string }> }) => {
    const origin = new URL(request.url).origin;

    if (!databaseConfigured) {
      return NextResponse.redirect(`${origin}/resources?link=unknown`, 302);
    }

    const { token } = (await ctx?.params) ?? { token: "" };
    const result = await redeemGrant(token);

    if (!result.ok) {
      return NextResponse.redirect(`${origin}/resources?link=${REASONS[result.reason]}`, 302);
    }

    return deliver(result.resource);
  },
);
