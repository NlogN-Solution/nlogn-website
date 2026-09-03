import { prisma } from "@/server/db";
import type { SeoProvider } from "@/generated/prisma";

/**
 * Cached provider payloads.
 *
 * This does three jobs that would otherwise be three mechanisms:
 *
 *  1. Keeps us inside upstream quotas. Search Console allows ~1,200 queries a
 *     minute per property, which sounds generous until a dashboard with six
 *     panels is opened by four people.
 *  2. Makes the dashboard fast — a keyword table is one row read, not a
 *     multi-second round trip to Google.
 *  3. Is what "showing the last successful data" reads from. That is why rows
 *     are kept *past* `expiresAt` instead of deleted: an expired row is stale,
 *     not worthless, and stale-with-a-timestamp beats an empty panel when a
 *     provider is down.
 */

export type CachedPayload<T> = {
  data: T;
  fetchedAt: Date;
  /** True when this was served past its TTL because the provider was unreachable. */
  stale: boolean;
};

export async function readCache<T>(
  websiteId: string,
  key: string,
  { allowStale = false }: { allowStale?: boolean } = {},
): Promise<CachedPayload<T> | null> {
  const row = await prisma.seoReportCache
    .findUnique({ where: { websiteId_key: { websiteId, key } } })
    .catch(() => null);

  if (!row) return null;

  const stale = row.expiresAt <= new Date();
  if (stale && !allowStale) return null;

  return { data: row.payload as T, fetchedAt: row.fetchedAt, stale };
}

export async function writeCache(
  websiteId: string,
  provider: SeoProvider,
  key: string,
  payload: unknown,
  ttlSeconds: number,
) {
  const now = new Date();
  const data = {
    provider,
    payload: payload as never,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
  };

  await prisma.seoReportCache
    .upsert({
      where: { websiteId_key: { websiteId, key } },
      create: { websiteId, key, ...data },
      update: data,
    })
    .catch((error) => {
      // A cache write failing must never fail the request that produced the
      // data — the caller already has what it asked for.
      console.error("[seo-cache] write failed:", error);
    });
}

/**
 * Read-through cache with a stale fallback.
 *
 * On a provider error this deliberately returns the last good payload rather
 * than propagating. `stale: true` rides along so the UI can say "last updated
 * 6 hours ago" instead of pretending the number is current.
 */
export async function cached<T>(
  websiteId: string,
  provider: SeoProvider,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  { force = false }: { force?: boolean } = {},
): Promise<CachedPayload<T> & { error?: string }> {
  if (!force) {
    const fresh = await readCache<T>(websiteId, key);
    if (fresh) return fresh;
  }

  try {
    const data = await fetcher();
    await writeCache(websiteId, provider, key, data, ttlSeconds);
    return { data, fetchedAt: new Date(), stale: false };
  } catch (error) {
    const stale = await readCache<T>(websiteId, key, { allowStale: true });
    const message = error instanceof Error ? error.message : "The provider could not be reached.";

    console.error(`[seo-cache] ${key} failed:`, message);

    if (stale) return { ...stale, stale: true, error: message };
    throw error;
  }
}

/** Drops a website's cached reports so the next read re-fetches. Used by "Sync now". */
export async function invalidate(websiteId: string, provider?: SeoProvider) {
  await prisma.seoReportCache
    .deleteMany({ where: { websiteId, ...(provider && { provider }) } })
    .catch(() => undefined);
}

export const TTL = {
  /** Search Console data settles daily; re-asking more often returns the same rows. */
  searchConsole: 60 * 60 * 6,
  analytics: 60 * 60 * 3,
  /** A Lighthouse run takes 10–30s and is noisy — daily is the honest cadence. */
  pageSpeed: 60 * 60 * 24,
  ahrefs: 60 * 60 * 24,
  /** Property lists change rarely, and are read every time settings open. */
  properties: 60 * 60 * 12,
} as const;
