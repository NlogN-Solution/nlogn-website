import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";

/**
 * Google OAuth 2.0 — the authorisation-code flow, by hand.
 *
 * No `googleapis` dependency: this codebase already talks to Cloudinary and
 * Anthropic over `fetch`, the package is enormous, and the three calls actually
 * needed here (authorize, exchange, refresh) are a page of code. Search Console
 * and the Analytics Data API are then plain REST.
 *
 * One consent covers both products, so an admin connects once rather than
 * twice. Both scopes are read-only — this dashboard reports, it never writes to
 * anybody's Google property.
 *
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI   defaults to <site>/api/admin/seo/oauth/google/callback
 *
 * The secret is read only in this module and never leaves the server.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export const SEARCH_CONSOLE_SCOPE = GOOGLE_SCOPES[0];
export const ANALYTICS_SCOPE = GOOGLE_SCOPES[1];

export function googleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function clientCredentials() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set.");
  }

  return { clientId, clientSecret };
}

export function redirectUri() {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${siteConfig.url}/api/admin/seo/oauth/google/callback`
  );
}

/* ── state ───────────────────────────────────────────────────────────────────
 *
 * The `state` parameter is the CSRF defence for the callback, so it cannot be
 * a value an attacker can produce. It is an HMAC-style digest of a random nonce
 * plus the website id, signed with the same key that protects the tokens —
 * which means no extra secret to configure and no server-side state to expire.
 */

type OAuthState = { websiteId: string; nonce: string };

function stateSecret() {
  // Reuses the token key rather than adding a fourth secret to deployment. It
  // never leaves the server and is already required for the flow to store
  // anything at the end of it.
  const raw = process.env.SEO_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("SEO_TOKEN_ENCRYPTION_KEY is not set.");
  return raw;
}

function signState(payload: string) {
  return createHash("sha256").update(`${payload}.${stateSecret()}`).digest("base64url");
}

export function encodeState(websiteId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ websiteId, nonce: randomBytes(16).toString("base64url") } satisfies OAuthState),
  ).toString("base64url");

  return `${payload}.${signState(payload)}`;
}

/** Returns null on anything that does not verify. Callers treat that as a hard stop. */
export function decodeState(state: string | null): OAuthState | null {
  if (!state) return null;

  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;

  const expected = signState(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
    return typeof parsed.websiteId === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/* ── flow ────────────────────────────────────────────────────────────────── */

export function authorizeUrl(websiteId: string): string {
  const { clientId } = clientCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    // `offline` is what returns a refresh token at all; without it the
    // connection dies in an hour and background sync never works.
    access_type: "offline",
    // Google only re-issues a refresh token on an explicit consent prompt. A
    // reconnect after a revocation would otherwise come back with an access
    // token and nothing to renew it with.
    prompt: "consent",
    include_granted_scopes: "true",
    state: encodeState(websiteId),
  });

  return `${AUTH_ENDPOINT}?${params}`;
}

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scopes: string[];
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function postToken(body: URLSearchParams): Promise<GoogleTokens> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok || !json.access_token) {
    // Google's `error_description` is safe to surface — it says things like
    // "Token has been expired or revoked", which is exactly what the
    // integrations page should tell somebody.
    throw new GoogleAuthError(
      json.error_description ?? json.error ?? `Google returned ${response.status}.`,
      response.status,
    );
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    // 60s of headroom, so a token cannot expire between the check and the call.
    expiresAt: new Date(Date.now() + ((json.expires_in ?? 3600) - 60) * 1000),
    scopes: json.scope?.split(" ") ?? [],
  };
}

export class GoogleAuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "GoogleAuthError";
    this.status = status;
  }
}

export function exchangeCode(code: string) {
  const { clientId, clientSecret } = clientCredentials();

  return postToken(
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  );
}

export function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = clientCredentials();

  return postToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  );
}

/** Which Google account this is, for the integrations page. Never fatal. */
export async function fetchAccountEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Best-effort revocation on disconnect. Deleting our copy is what actually
 * matters, so a failure here is logged and swallowed rather than blocking it.
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[google-oauth] revoke failed:", error);
  }
}
