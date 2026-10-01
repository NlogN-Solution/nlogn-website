import { prisma } from "@/server/db";
import { assertPublicUrl } from "@/server/net-guard";
import type { Website } from "@/generated/prisma";

/**
 * Websites — the thing every SEO figure hangs off.
 *
 * `loadWebsite` is the authorisation choke point for the whole feature. Every
 * endpoint resolves its `:id` through it and 404s on a miss, so no handler ever
 * trusts a website id straight off the request. Capability checks happen in
 * `guard()`; this is what stops a valid session reading a record that does not
 * exist or has been deactivated.
 */

export type WebsiteSummary = {
  id: string;
  name: string;
  domain: string;
  ga4PropertyId: string | null;
  gscSiteUrl: string | null;
  ahrefsDomain: string | null;
  isActive: boolean;
  createdAt: string;
};

export function toSummary(website: Website): WebsiteSummary {
  return {
    id: website.id,
    name: website.name,
    domain: website.domain,
    ga4PropertyId: website.ga4PropertyId,
    gscSiteUrl: website.gscSiteUrl,
    ahrefsDomain: website.ahrefsDomain,
    isActive: website.isActive,
    createdAt: website.createdAt.toISOString(),
  };
}

export function listWebsites() {
  return prisma.website.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
}

/** Returns null rather than throwing, so callers answer 404 in one line. */
export function loadWebsite(id: string) {
  return prisma.website.findUnique({ where: { id } }).catch(() => null);
}

/**
 * Reduces anything paste-able to a bare hostname: "https://www.NLOGN.com/x" and
 * "nlogn.com" both become "nlogn.com". Stored that way so the unique constraint
 * on `domain` actually prevents duplicates rather than merely different
 * spellings of one.
 */
export function normaliseDomain(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const withScheme = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withScheme).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "").replace(/\/.*$/, "");
  }
}

/**
 * Rejects a domain the crawler would later refuse anyway.
 *
 * Catching it at creation is worth doing on its own — being told "that address
 * is on a private network" while adding a site is far clearer than an audit
 * that silently finds nothing three screens later.
 */
export async function assertCrawlableDomain(domain: string): Promise<void> {
  await assertPublicUrl(`https://${domain}`);
}

export async function createWebsite(input: {
  name: string;
  domain: string;
  ga4PropertyId?: string | null;
  gscSiteUrl?: string | null;
  ahrefsDomain?: string | null;
}) {
  const domain = normaliseDomain(input.domain);
  await assertCrawlableDomain(domain);

  return prisma.website.create({
    data: {
      name: input.name.trim(),
      domain,
      ga4PropertyId: input.ga4PropertyId ?? null,
      gscSiteUrl: input.gscSiteUrl ?? null,
      ahrefsDomain: input.ahrefsDomain ?? null,
    },
  });
}

export async function updateWebsite(
  id: string,
  input: Partial<{
    name: string;
    domain: string;
    ga4PropertyId: string | null;
    gscSiteUrl: string | null;
    ahrefsDomain: string | null;
    isActive: boolean;
  }>,
) {
  const data: Record<string, unknown> = { ...input };

  if (input.domain !== undefined) {
    const domain = normaliseDomain(input.domain);
    await assertCrawlableDomain(domain);
    data.domain = domain;
  }

  return prisma.website.update({ where: { id }, data });
}

/** Cascades to connections, metrics, issues and cache — all declared in the schema. */
export function deleteWebsite(id: string) {
  return prisma.website.delete({ where: { id } });
}

export function websiteExistsForDomain(domain: string) {
  return prisma.website.findUnique({ where: { domain: normaliseDomain(domain) } });
}
