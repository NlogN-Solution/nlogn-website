import { NextResponse } from "next/server";
import { prisma, databaseConfigured } from "@/server/db";
import { handler } from "@/server/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { deliver } from "@/server/resource-download";

/**
 * The ungated download.
 *
 * A FREE resource has no grant to spend, so it is addressed by slug and served
 * to anyone who asks. That is the point of the tier rather than a hole in it:
 * these are the public repos and open cheatsheets whose URLs get re-posted
 * anyway, and pretending otherwise would only cost the conversions the free
 * tier exists to earn.
 *
 * A gated resource is refused here outright — the slug must never be a way
 * around `/api/resources/download/<token>`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(
  async (request: Request, ctx?: { params: Promise<{ slug: string }> }) => {
    const origin = new URL(request.url).origin;

    if (!databaseConfigured) {
      return NextResponse.redirect(`${origin}/resources`, 302);
    }

    // Generous, and per-IP: the ceiling is here to stop the endpoint being used
    // as free bandwidth, not to ration a visitor collecting a few files.
    const limit = rateLimit(`resource-file:${clientIp(request.headers)}`, 30, 10 * 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many downloads. Try again shortly." } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { slug } = (await ctx?.params) ?? { slug: "" };
    const resource = await prisma.resource.findFirst({
      where: { slug, status: "PUBLISHED", gate: "FREE" },
    });

    if (!resource) return NextResponse.redirect(`${origin}/resources`, 302);

    await prisma.resource
      .update({ where: { id: resource.id }, data: { downloads: { increment: 1 } } })
      .catch((error) => console.error("[resources] download count failed:", error));

    return deliver(resource);
  },
);
