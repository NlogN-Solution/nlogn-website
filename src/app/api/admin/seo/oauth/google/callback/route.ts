import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth";
import { can } from "@/server/permissions";
import { logActivity } from "@/server/activity";
import {
  ANALYTICS_SCOPE,
  SEARCH_CONSOLE_SCOPE,
  decodeState,
  exchangeCode,
  fetchAccountEmail,
} from "@/server/integrations/google-oauth";
import { upsertConnection } from "@/server/services/seo-connection.service";
import { loadWebsite } from "@/server/services/website.service";
import type { AdminRole } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step two: Google sends the admin back here with an authorisation code.
 *
 * This is a browser redirect, not an API call, so it answers with a redirect to
 * the integrations page carrying a status — never with JSON, and never with
 * anything from the token response in the URL.
 *
 * Three checks before anything is stored:
 *   1. A live admin session with `seo:connect`. Without this the endpoint would
 *      accept a code from anybody who could reach the URL.
 *   2. A `state` that verifies against our own signature — the CSRF defence.
 *   3. The website named in that state still exists.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (websiteId: string | null, status: string) =>
    NextResponse.redirect(
      new URL(
        websiteId ? `/admin/seo/${websiteId}/integrations?google=${status}` : `/admin/seo?google=${status}`,
        url.origin,
      ),
    );

  const user = await getSessionUser();
  if (!user || !can(user.role as AdminRole, "seo:connect")) {
    return back(null, "forbidden");
  }

  // Google reports a refused consent screen here; it is not an error worth
  // logging, just a redirect back with nothing changed.
  const denied = url.searchParams.get("error");
  const state = decodeState(url.searchParams.get("state"));

  if (denied) return back(state?.websiteId ?? null, "cancelled");
  if (!state) return back(null, "invalid_state");

  const code = url.searchParams.get("code");
  if (!code) return back(state.websiteId, "missing_code");

  const website = await loadWebsite(state.websiteId);
  if (!website) return back(null, "unknown_website");

  try {
    const tokens = await exchangeCode(code);
    const email = await fetchAccountEmail(tokens.accessToken);

    // Stored once under the Search Console provider; the Analytics client reads
    // the same credential. One consent, one refresh token, one thing to revoke.
    await upsertConnection(website.id, "GOOGLE_SEARCH_CONSOLE", {
      status: "CONNECTED",
      accountLabel: email,
      scopes: tokens.scopes,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.expiresAt,
      lastSyncError: null,
    });

    // A separate row for Analytics so the integrations page can show the two
    // products independently — the admin may have granted only one scope.
    if (tokens.scopes.includes(ANALYTICS_SCOPE)) {
      await upsertConnection(website.id, "GOOGLE_ANALYTICS", {
        status: "CONNECTED",
        accountLabel: email,
        scopes: tokens.scopes,
        lastSyncError: null,
      });
    }

    await logActivity(user, {
      action: "seo.google.connected",
      resource: "website",
      resourceId: website.id,
      summary: `Connected Google${email ? ` (${email})` : ""} to ${website.domain}`,
      metadata: {
        // The scopes granted are worth auditing. The tokens are not recorded
        // anywhere but the encrypted column.
        searchConsole: tokens.scopes.includes(SEARCH_CONSOLE_SCOPE),
        analytics: tokens.scopes.includes(ANALYTICS_SCOPE),
      },
    });

    return back(website.id, "connected");
  } catch (error) {
    console.error("[seo] google callback failed:", error);
    return back(website.id, "failed");
  }
}
