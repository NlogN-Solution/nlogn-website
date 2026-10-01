import { NextResponse } from "next/server";
import { databaseConfigured } from "@/server/db";
import { handler } from "@/server/http";
import { resolveShortLink } from "@/server/services/resource-access.service";
import { CAMPAIGN_COOKIE, CAMPAIGN_COOKIE_DAYS } from "@/config/resources";

/**
 * `/r/<code>` — the link that goes in a reel caption, a comment reply or a DM.
 *
 * Short because people transcribe it by hand off one phone screen onto another,
 * and one code per video because "which reel actually converted" is otherwise
 * unanswerable: Instagram's in-app browser sends no referer worth having.
 *
 * The redirect happens first and the bookkeeping is incidental to it. An
 * unknown code lands on the library rather than a 404 — the commonest cause by
 * far is a caption typed with one character wrong, and a person who came
 * looking for something should be shown the shelf it is on.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(
  async (request: Request, ctx?: { params: Promise<{ code: string }> }) => {
    const origin = new URL(request.url).origin;
    const { code } = (await ctx?.params) ?? { code: "" };

    const link = databaseConfigured ? await resolveShortLink(code.toLowerCase()) : null;

    // An unpublished target is treated as an unknown one: a link shared before
    // the resource went live should not expose a draft.
    const destination =
      link && link.published ? `${origin}/resources/${link.slug}` : `${origin}/resources`;

    const response = NextResponse.redirect(destination, 302);

    if (link) {
      /*
       * Which link brought them, remembered until they convert.
       *
       * This carries a campaign code and nothing about the person — no id, no
       * profile, nothing that could be joined back to them — which is why it is
       * set without waiting on the consent banner. `lax` so it survives the
       * cross-site hop from Instagram, and `httpOnly` because only the unlock
       * endpoint ever needs to read it.
       */
      response.cookies.set(CAMPAIGN_COOKIE, link.code, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CAMPAIGN_COOKIE_DAYS * 24 * 60 * 60,
      });
    }

    return response;
  },
);
