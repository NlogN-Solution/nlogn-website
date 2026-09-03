import { prisma } from "@/server/db";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import {
  GoogleAuthError,
  refreshAccessToken,
  revokeToken,
} from "@/server/integrations/google-oauth";
import type { ConnectionStatus, SeoConnection, SeoProvider } from "@/generated/prisma";

/**
 * Provider connections, and the only place credentials are read or written.
 *
 * Nothing outside this module sees a token. Callers ask for
 * `googleAccessToken(websiteId)` and get a usable string or null; the refresh
 * dance, the re-encryption and the status bookkeeping all happen here, so no
 * route handler can accidentally serialise a connection row — which is exactly
 * how refresh tokens end up in a JSON response.
 */

/** The connection shape that is safe to send to the browser. */
export type PublicConnection = {
  provider: SeoProvider;
  status: ConnectionStatus;
  accountLabel: string | null;
  scopes: string[];
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  capabilities: unknown;
};

/** Strips every secret. Every API response goes through this, without exception. */
export function toPublicConnection(connection: SeoConnection): PublicConnection {
  return {
    provider: connection.provider,
    status: connection.status,
    accountLabel: connection.accountLabel,
    scopes: connection.scopes,
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: connection.lastSyncError,
    capabilities: connection.capabilities ?? null,
  };
}

export function getConnection(websiteId: string, provider: SeoProvider) {
  return prisma.seoConnection.findUnique({
    where: { websiteId_provider: { websiteId, provider } },
  });
}

export function listConnections(websiteId: string) {
  return prisma.seoConnection.findMany({ where: { websiteId }, orderBy: { provider: "asc" } });
}

export async function upsertConnection(
  websiteId: string,
  provider: SeoProvider,
  data: {
    status: ConnectionStatus;
    accountLabel?: string | null;
    scopes?: string[];
    accessToken?: string | null;
    refreshToken?: string | null;
    accessTokenExpiresAt?: Date | null;
    capabilities?: unknown;
    lastSyncError?: string | null;
  },
) {
  const encrypted = {
    ...(data.accessToken !== undefined && {
      encryptedAccessToken: data.accessToken ? encryptSecret(data.accessToken) : null,
    }),
    // A refresh from Google frequently omits the refresh token. `undefined`
    // must therefore mean "leave it alone" and only an explicit null clears it,
    // or every hourly refresh would delete the credential it depends on.
    ...(data.refreshToken !== undefined && {
      encryptedRefreshToken: data.refreshToken ? encryptSecret(data.refreshToken) : null,
    }),
  };

  const fields = {
    status: data.status,
    accountLabel: data.accountLabel ?? undefined,
    scopes: data.scopes ?? undefined,
    accessTokenExpiresAt: data.accessTokenExpiresAt ?? undefined,
    capabilities: (data.capabilities ?? undefined) as never,
    lastSyncError: data.lastSyncError === undefined ? undefined : data.lastSyncError,
    ...encrypted,
  };

  return prisma.seoConnection.upsert({
    where: { websiteId_provider: { websiteId, provider } },
    create: { websiteId, provider, ...fields },
    update: fields,
  });
}

export async function markStatus(
  websiteId: string,
  provider: SeoProvider,
  status: ConnectionStatus,
  error?: string | null,
) {
  await prisma.seoConnection
    .update({
      where: { websiteId_provider: { websiteId, provider } },
      data: { status, lastSyncError: error ?? null },
    })
    .catch(() => undefined);
}

export async function markSynced(websiteId: string, provider: SeoProvider) {
  await prisma.seoConnection
    .update({
      where: { websiteId_provider: { websiteId, provider } },
      data: { lastSyncedAt: new Date(), lastSyncError: null, status: "CONNECTED" },
    })
    .catch(() => undefined);
}

export async function disconnect(websiteId: string, provider: SeoProvider) {
  const connection = await getConnection(websiteId, provider);
  if (!connection) return;

  if (provider === "GOOGLE_SEARCH_CONSOLE" || provider === "GOOGLE_ANALYTICS") {
    const refresh = decryptSecret(connection.encryptedRefreshToken);
    if (refresh) await revokeToken(refresh);
  }

  // Deleted rather than blanked: a row with null tokens and CONNECTED status is
  // the kind of thing that later reads as "connected" to something.
  await prisma.seoConnection.delete({
    where: { websiteId_provider: { websiteId, provider } },
  });
}

/* ── Google access tokens ────────────────────────────────────────────────── */

/**
 * A valid Google access token, refreshing it if needed, or null.
 *
 * Both Google connections share one credential — the OAuth consent covers both
 * scopes — so the token is stored once under GOOGLE_SEARCH_CONSOLE and read
 * from there by the Analytics client too.
 */
export const GOOGLE_CREDENTIAL_PROVIDER: SeoProvider = "GOOGLE_SEARCH_CONSOLE";

export async function googleAccessToken(websiteId: string): Promise<string | null> {
  const connection = await getConnection(websiteId, GOOGLE_CREDENTIAL_PROVIDER);
  if (!connection) return null;

  const current = decryptSecret(connection.encryptedAccessToken);
  if (current && connection.accessTokenExpiresAt && connection.accessTokenExpiresAt > new Date()) {
    return current;
  }

  const refresh = decryptSecret(connection.encryptedRefreshToken);
  if (!refresh) {
    await markStatus(
      websiteId,
      GOOGLE_CREDENTIAL_PROVIDER,
      "NEEDS_REAUTH",
      "No refresh token is stored. Reconnect the Google account.",
    );
    return null;
  }

  try {
    const tokens = await refreshAccessToken(refresh);

    await upsertConnection(websiteId, GOOGLE_CREDENTIAL_PROVIDER, {
      status: "CONNECTED",
      accessToken: tokens.accessToken,
      // Google usually omits it on refresh; `undefined` keeps the stored one.
      refreshToken: tokens.refreshToken ?? undefined,
      accessTokenExpiresAt: tokens.expiresAt,
      lastSyncError: null,
    });

    return tokens.accessToken;
  } catch (error) {
    const revoked = error instanceof GoogleAuthError && error.status < 500;

    await markStatus(
      websiteId,
      GOOGLE_CREDENTIAL_PROVIDER,
      // A 5xx is Google having a bad day, not a dead credential — telling
      // somebody to reconnect over a transient outage wastes their time.
      revoked ? "NEEDS_REAUTH" : "ERROR",
      error instanceof Error ? error.message : "Could not refresh the Google token.",
    );

    console.error("[seo] google token refresh failed:", error);
    return null;
  }
}
