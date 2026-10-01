import {
  AHREFS_UNAVAILABLE_REASON,
  UNAVAILABLE,
  ahrefsConfigured,
  fetchOverview,
  fetchReferringDomains,
  probeCapabilities,
  type AhrefsCapabilities,
  type AhrefsOverview,
  type AhrefsRefDomain,
} from "@/server/integrations/ahrefs";
import { TTL, cached } from "@/server/services/seo-cache.service";
import { getConnection, upsertConnection } from "@/server/services/seo-connection.service";
import type { Website } from "@/generated/prisma";

/**
 * Ahrefs reporting.
 *
 * The honest position, stated once here and surfaced verbatim in the UI:
 * **Ahrefs Webmaster Tools has no API**, so a free Ahrefs account cannot supply
 * backlinks, referring domains or keyword counts to a dashboard, however
 * complete that data looks inside the Ahrefs website.
 *
 * Rather than fill the gap with estimates, this returns `available: false` with
 * the reason, and the backlinks section renders an explanation instead of
 * numbers. Adding an API token from a paid plan turns the same section on with
 * real figures and nothing else changes.
 */

export type BacklinkReport =
  | { available: false; reason: string; plan: string | null }
  | {
      available: true;
      plan: string | null;
      overview: AhrefsOverview;
      referringDomains: AhrefsRefDomain[] | null;
      /** Which reports this plan actually answered for. */
      endpoints: string[];
      unitsUsed: number | null;
      unitsLimit: number | null;
      fetchedAt: string;
      stale: boolean;
    };

/**
 * Stored capabilities, re-probed when absent.
 *
 * The probe costs an API call, so the answer is kept on the connection row and
 * only refreshed when the settings page asks for it explicitly.
 */
export async function ahrefsCapabilities(
  website: Website,
  { refresh = false } = {},
): Promise<AhrefsCapabilities> {
  if (!ahrefsConfigured()) return UNAVAILABLE;

  const connection = await getConnection(website.id, "AHREFS");

  if (!refresh && connection?.capabilities) {
    return connection.capabilities as unknown as AhrefsCapabilities;
  }

  const target = website.ahrefsDomain || website.domain;
  const capabilities = await probeCapabilities(target);

  await upsertConnection(website.id, "AHREFS", {
    status: capabilities.available ? "CONNECTED" : "UNAVAILABLE",
    accountLabel: capabilities.plan ? `${capabilities.plan} plan` : null,
    capabilities: capabilities as unknown,
    lastSyncError: capabilities.available ? null : capabilities.reason,
  }).catch(() => undefined);

  return capabilities;
}

export async function backlinkReport(
  website: Website,
  { force = false } = {},
): Promise<BacklinkReport> {
  if (!ahrefsConfigured()) {
    return { available: false, reason: AHREFS_UNAVAILABLE_REASON, plan: null };
  }

  const capabilities = await ahrefsCapabilities(website, { refresh: force });

  if (!capabilities.available) {
    return {
      available: false,
      reason: capabilities.reason ?? AHREFS_UNAVAILABLE_REASON,
      plan: capabilities.plan,
    };
  }

  const target = website.ahrefsDomain || website.domain;

  try {
    const result = await cached(
      website.id,
      "AHREFS",
      `ahrefs:overview:${target}`,
      TTL.ahrefs,
      async () => {
        const [overview, referringDomains] = await Promise.all([
          fetchOverview(target, capabilities),
          fetchReferringDomains(target, capabilities),
        ]);
        return { overview, referringDomains };
      },
      { force },
    );

    return {
      available: true,
      plan: capabilities.plan,
      overview: result.data.overview,
      referringDomains: result.data.referringDomains,
      endpoints: capabilities.endpoints,
      unitsUsed: capabilities.unitsUsed,
      unitsLimit: capabilities.unitsLimit,
      fetchedAt: result.fetchedAt.toISOString(),
      stale: result.stale,
    };
  } catch (error) {
    console.error("[ahrefs] report failed:", error);
    return {
      available: false,
      reason: "Ahrefs could not be reached. The data below is unavailable until it responds again.",
      plan: capabilities.plan,
    };
  }
}
