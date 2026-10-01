/**
 * Ahrefs API v3 — probe first, assume nothing.
 *
 * The important fact, and the reason this module is shaped the way it is:
 *
 *   **Ahrefs Webmaster Tools (the free tier) has no API.** It is a web
 *   interface only. Site Audit, Site Explorer for verified domains and Web
 *   Analytics are all real products, and none of them is reachable
 *   programmatically. There is no key to find and no endpoint to call.
 *
 * API v3 exists on paid plans (included from Lite upward as of early 2026),
 * is metered in units — a minimum of ~50 per call — and is rate limited to
 * around 60 requests a minute. Which endpoints a given token may call depends
 * on the plan, so this module never assumes: `probeCapabilities` asks the
 * subscription endpoint what is actually permitted and records the answer on
 * the connection. Anything not permitted is hidden in the UI rather than
 * estimated, guessed, or filled in with a plausible-looking number.
 *
 *   AHREFS_API_TOKEN   only present on a plan that includes API access
 */

const API = "https://api.ahrefs.com/v3";

export function ahrefsConfigured() {
  return Boolean(process.env.AHREFS_API_TOKEN);
}

/** Why Ahrefs data is not being shown. Rendered verbatim on the dashboard. */
export const AHREFS_UNAVAILABLE_REASON =
  "Ahrefs data is unavailable for this account or plan. Ahrefs Webmaster Tools is a web interface with no API, so backlink and keyword figures cannot be read automatically. Adding an API token from a paid Ahrefs plan turns this section on.";

export class AhrefsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AhrefsError";
    this.status = status;
  }
}

async function call<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.AHREFS_API_TOKEN;
  if (!token) throw new AhrefsError("AHREFS_API_TOKEN is not set.", 401);

  const url = `${API}${path}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new AhrefsError(
      detail?.error ?? `Ahrefs returned ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/* ── capability probing ──────────────────────────────────────────────────── */

export type AhrefsCapabilities = {
  available: boolean;
  reason: string | null;
  plan: string | null;
  unitsUsed: number | null;
  unitsLimit: number | null;
  /** Endpoints this token actually answered for. Only these get rendered. */
  endpoints: string[];
};

export const UNAVAILABLE: AhrefsCapabilities = {
  available: false,
  reason: AHREFS_UNAVAILABLE_REASON,
  plan: null,
  unitsUsed: null,
  unitsLimit: null,
  endpoints: [],
};

/**
 * Asks Ahrefs what this token can do, rather than deciding from a plan name.
 *
 * The subscription endpoint is free of unit cost, so this is safe to call on
 * connect and from the settings page's "Test connection" button. Each metric
 * endpoint is then probed with a one-row request against the domain, because a
 * plan carrying units does not necessarily carry every report.
 */
export async function probeCapabilities(domain: string): Promise<AhrefsCapabilities> {
  if (!ahrefsConfigured()) return UNAVAILABLE;

  let plan: string | null = null;
  let unitsUsed: number | null = null;
  let unitsLimit: number | null = null;

  try {
    const info = await call<{
      limits_and_usage?: {
        subscription?: string;
        usage_reset_date?: string;
        units_limit_workspace?: number;
        units_usage_workspace?: number;
      };
    }>("/subscription-info/limits-and-usage");

    const limits = info.limits_and_usage;
    plan = limits?.subscription ?? null;
    unitsUsed = limits?.units_usage_workspace ?? null;
    unitsLimit = limits?.units_limit_workspace ?? null;

    // Ahrefs reports free-tier tokens as a subscription with no API allowance.
    // Treating that as "connected" would produce a section that renders empty
    // panels and 403s forever.
    if (unitsLimit !== null && unitsLimit <= 0) {
      return {
        ...UNAVAILABLE,
        plan,
        reason:
          "This Ahrefs plan includes no API units, so backlink and keyword data cannot be read. Ahrefs Webmaster Tools has no API.",
      };
    }
  } catch (error) {
    const status = error instanceof AhrefsError ? error.status : 0;

    return {
      ...UNAVAILABLE,
      reason:
        status === 401 || status === 403
          ? "The Ahrefs token was rejected. Check that it is current and that the plan includes API access."
          : AHREFS_UNAVAILABLE_REASON,
    };
  }

  const endpoints = await probeEndpoints(domain);

  return {
    available: endpoints.length > 0,
    reason: endpoints.length > 0 ? null : "This Ahrefs plan does not expose any of the reports this dashboard uses.",
    plan,
    unitsUsed,
    unitsLimit,
    endpoints,
  };
}

const PROBES = [
  "site-explorer/domain-rating",
  "site-explorer/backlinks-stats",
  "site-explorer/refdomains",
  "site-explorer/metrics",
  "site-explorer/organic-keywords",
  "site-explorer/top-pages",
] as const;

async function probeEndpoints(domain: string): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const available: string[] = [];

  // Sequential: 60 requests a minute is the ceiling, and a burst of six is a
  // pointless way to spend the headroom a real report will need.
  for (const endpoint of PROBES) {
    try {
      await call(`/${endpoint}`, { target: domain, date: today, limit: "1" });
      available.push(endpoint);
    } catch (error) {
      // 402/403 mean "not on this plan" and are the expected answer here. Only
      // an unexpected shape is worth a log line.
      const status = error instanceof AhrefsError ? error.status : 0;
      if (status !== 402 && status !== 403 && status !== 404) {
        console.error(`[ahrefs] probe ${endpoint} failed:`, error);
      }
    }
  }

  return available;
}

/* ── reports ─────────────────────────────────────────────────────────────── */

export type AhrefsOverview = {
  domainRating: number | null;
  urlRating: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  organicKeywords: number | null;
  organicTraffic: number | null;
  organicTrafficValue: number | null;
};

/**
 * Every field is independently null. A plan that answers for backlinks but not
 * organic keywords produces a card for the first and nothing for the second,
 * which is the honest rendering of partial access.
 */
export async function fetchOverview(
  domain: string,
  capabilities: AhrefsCapabilities,
): Promise<AhrefsOverview> {
  const today = new Date().toISOString().slice(0, 10);
  const can = (endpoint: string) => capabilities.endpoints.includes(endpoint);

  const overview: AhrefsOverview = {
    domainRating: null,
    urlRating: null,
    backlinks: null,
    referringDomains: null,
    organicKeywords: null,
    organicTraffic: null,
    organicTrafficValue: null,
  };

  if (can("site-explorer/domain-rating")) {
    const data = await call<{ domain_rating?: { domain_rating?: number } }>(
      "/site-explorer/domain-rating",
      { target: domain, date: today },
    ).catch(() => null);
    overview.domainRating = data?.domain_rating?.domain_rating ?? null;
  }

  if (can("site-explorer/backlinks-stats")) {
    const data = await call<{ metrics?: { live?: number; live_refdomains?: number } }>(
      "/site-explorer/backlinks-stats",
      { target: domain, mode: "domain", date: today },
    ).catch(() => null);
    overview.backlinks = data?.metrics?.live ?? null;
    overview.referringDomains = data?.metrics?.live_refdomains ?? null;
  }

  if (can("site-explorer/metrics")) {
    const data = await call<{
      metrics?: { org_keywords?: number; org_traffic?: number; org_cost?: number };
    }>("/site-explorer/metrics", { target: domain, date: today, volume_mode: "monthly" }).catch(
      () => null,
    );
    overview.organicKeywords = data?.metrics?.org_keywords ?? null;
    overview.organicTraffic = data?.metrics?.org_traffic ?? null;
    overview.organicTrafficValue = data?.metrics?.org_cost ?? null;
  }

  return overview;
}

export type AhrefsRefDomain = { domain: string; domainRating: number | null; links: number };

export async function fetchReferringDomains(
  domain: string,
  capabilities: AhrefsCapabilities,
  limit = 25,
): Promise<AhrefsRefDomain[] | null> {
  if (!capabilities.endpoints.includes("site-explorer/refdomains")) return null;

  const data = await call<{
    refdomains?: { refdomain?: string; domain_rating?: number; links_to_target?: number }[];
  }>("/site-explorer/refdomains", {
    target: domain,
    mode: "domain",
    limit: String(limit),
    order_by: "links_to_target:desc",
    select: "refdomain,domain_rating,links_to_target",
  }).catch(() => null);

  if (!data?.refdomains) return null;

  return data.refdomains.map((row) => ({
    domain: row.refdomain ?? "",
    domainRating: row.domain_rating ?? null,
    links: row.links_to_target ?? 0,
  }));
}
