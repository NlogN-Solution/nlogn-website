import { NextResponse } from "next/server";
import { guard } from "@/server/middleware/guard";
import { errors } from "@/server/http";
import { encryptionConfigured } from "@/server/crypto";
import { authorizeUrl, googleOAuthConfigured } from "@/server/integrations/google-oauth";
import { loadWebsite } from "@/server/services/website.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step one of the Google connection: redirect the admin to Google's consent
 * screen.
 *
 * `seo:connect` rather than `seo:write`, because completing this grants the
 * application read access to an account outside it.
 *
 * The website id travels in the signed `state` parameter rather than in a
 * cookie or the session, so the callback can verify both that the request came
 * from us and which website it was for.
 */
export const GET = guard("seo:connect", async (_request, { url }) => {
  const websiteId = url.searchParams.get("websiteId");
  if (!websiteId) return errors.badRequest("Which website is this connection for?");

  if (!googleOAuthConfigured()) {
    return errors.badRequest(
      "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.",
    );
  }

  if (!encryptionConfigured()) {
    // Refused rather than stored in plaintext. Failing here is recoverable in
    // one command; a plaintext refresh token in the database is not.
    return errors.badRequest(
      "SEO_TOKEN_ENCRYPTION_KEY is not set, so the connection could not be stored securely. Generate one with: openssl rand -base64 32",
    );
  }

  const website = await loadWebsite(websiteId);
  if (!website) return errors.notFound("That website");

  return NextResponse.json({ success: true, data: { url: authorizeUrl(website.id) } });
});
