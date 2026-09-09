import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/server/db";
import { GRANT_MAX_USES, GRANT_TTL_HOURS } from "@/config/resources";
import type { Resource } from "@/generated/prisma";

/**
 * Opening the gate, and what happens after.
 *
 * The shape here mirrors `server/auth.ts` on purpose. A download link is a
 * capability — anyone holding it can take the file — so it is treated like a
 * session: an opaque random token in the URL, only its SHA-256 in the database,
 * an expiry, and a use count. A dump of `DownloadGrant` cannot be replayed as a
 * download, and a link pasted into a group chat stops working instead of
 * quietly becoming a public mirror.
 */

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Disposable-address domains.
 *
 * Deliberately short and deliberately not a service call: the point is to stop
 * the reflexive "type a junk address" habit, not to win an arms race. Anyone
 * determined enough to find a domain that is not on this list has earned the
 * file, and a blocklist that rejects a real customer costs far more than a
 * throwaway that gets through.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "throwawaymail.com",
]);

export function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && DISPOSABLE_DOMAINS.has(domain));
}

/* ── grants ──────────────────────────────────────────────────────────────── */

export type Grant = { token: string; expiresAt: Date };

/**
 * Issues a capability to download.
 *
 * The plaintext token is returned once and never stored — exactly the bargain
 * `AdminSession` makes with its cookie. Re-unlocking with the same address
 * simply mints a new grant rather than resurrecting the old one, which keeps
 * "I lost the email" a one-click fix without extending anything's lifetime.
 */
export async function issueGrant(resourceId: string, email: string): Promise<Grant> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + GRANT_TTL_HOURS * 60 * 60 * 1000);

  await prisma.downloadGrant.create({
    data: {
      tokenHash: hashToken(token),
      resourceId,
      email,
      expiresAt,
      maxUses: GRANT_MAX_USES,
    },
  });

  return { token, expiresAt };
}

export type RedeemResult =
  | { ok: true; resource: Resource }
  | { ok: false; reason: "unknown" | "expired" | "exhausted" | "unavailable" };

/**
 * Spends one use of a grant and returns what it unlocks.
 *
 * The lookup is by hash, so the token in the URL is never compared against
 * anything stored. `timingSafeEqual` on the re-derived hash is belt and braces
 * over the unique index — the index already decides this in constant time as
 * far as an attacker can observe, and the comparison costs nothing.
 */
export async function redeemGrant(token: string): Promise<RedeemResult> {
  if (!token || token.length > 200) return { ok: false, reason: "unknown" };

  const tokenHash = hashToken(token);
  const grant = await prisma.downloadGrant.findUnique({
    where: { tokenHash },
    include: { resource: true },
  });

  if (!grant) return { ok: false, reason: "unknown" };

  const supplied = Buffer.from(tokenHash);
  const stored = Buffer.from(grant.tokenHash);
  if (supplied.length !== stored.length || !timingSafeEqual(supplied, stored)) {
    return { ok: false, reason: "unknown" };
  }

  if (grant.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (grant.useCount >= grant.maxUses) return { ok: false, reason: "exhausted" };
  if (grant.resource.status !== "PUBLISHED") return { ok: false, reason: "unavailable" };

  /*
   * The counter moves before the bytes are served, not after. Streaming a
   * 200MB file can fail halfway, and a use that is only recorded on success
   * makes the limit trivially defeatable by aborting the connection.
   *
   * Two statements rather than one `$transaction`: the Neon HTTP transport this
   * app can be configured with has no interactive transactions, and `db.ts`
   * documents that nothing here uses them. The use count is the one that has to
   * land — it is the limit — so it goes first, and a failure after it leaves the
   * public download tally low by one rather than a grant spendable forever.
   */
  await prisma.downloadGrant.update({
    where: { id: grant.id },
    data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
  });
  await prisma.resource
    .update({ where: { id: grant.resourceId }, data: { downloads: { increment: 1 } } })
    .catch((error) => console.error("[resources] download count failed:", error));

  return { ok: true, resource: grant.resource };
}

/* ── leads ───────────────────────────────────────────────────────────────── */

export type LeadInput = {
  resourceId: string;
  email: string;
  name?: string | null;
  campaign?: string | null;
  source?: string | null;
  referer?: string | null;
  marketingConsent: boolean;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Records who unlocked what, and keeps the mailing list in step.
 *
 * Two writes, and only the first is unconditional. The lead row is the
 * attribution record and is upserted per (resource, email) — coming back for
 * the same file a second time is not a second lead. The newsletter subscriber
 * is written **only** when marketing consent was actually given: fulfilling a
 * download is not permission to send a newsletter, and conflating the two is
 * how a list stops being worth having.
 *
 * `unlocks` only moves for a genuinely new lead, so the number stays comparable
 * with `downloads` rather than counting the same person twice.
 */
export async function recordLead(input: LeadInput) {
  const existing = await prisma.resourceLead.findUnique({
    where: { resourceId_email: { resourceId: input.resourceId, email: input.email } },
    select: { id: true },
  });

  await prisma.resourceLead.upsert({
    where: { resourceId_email: { resourceId: input.resourceId, email: input.email } },
    create: {
      resourceId: input.resourceId,
      email: input.email,
      name: input.name || null,
      campaign: input.campaign || null,
      source: input.source || null,
      referer: input.referer || null,
      marketingConsent: input.marketingConsent,
      ip: input.ip || null,
      userAgent: input.userAgent || null,
    },
    update: {
      // Attribution belongs to the first touch: the reel that earned the
      // address is the one that should get the credit, not whichever link they
      // happened to click months later. Consent, by contrast, is always the
      // most recent answer — the only honest reading of a tick box.
      name: input.name || undefined,
      marketingConsent: input.marketingConsent,
    },
  });

  if (!existing) {
    await prisma.resource.update({
      where: { id: input.resourceId },
      data: { unlocks: { increment: 1 } },
    });
  }

  if (input.marketingConsent) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        source: input.campaign ? `resource:${input.campaign}` : "resource",
        confirmedAt: new Date(),
      },
      update: { isActive: true, unsubscribedAt: null },
    });
  }

  return { isNew: !existing };
}

/* ── short links ─────────────────────────────────────────────────────────── */

/**
 * A code short enough to read off a phone screen and type into another one.
 *
 * Base32 without the characters that get misread out loud or in a caption —
 * no 0/O, no 1/I/L. Six of them is about a billion combinations, which is
 * ample for a link space that only ever holds a few hundred entries.
 */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function mintCode(length = 6) {
  const bytes = randomBytes(length);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

export async function createShortLink(
  resourceId: string,
  input: { code?: string; platform?: string | null; note?: string | null },
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = input.code || mintCode();
    const clash = await prisma.shortLink.findUnique({ where: { code }, select: { id: true } });
    if (clash) {
      // A hand-typed code that is taken is a mistake worth reporting; a minted
      // one that collides is just bad luck, so try again.
      if (input.code) return { ok: false as const, reason: "That code is already in use." };
      continue;
    }

    const link = await prisma.shortLink.create({
      data: {
        code,
        resourceId,
        platform: input.platform || null,
        note: input.note || null,
      },
    });
    return { ok: true as const, link };
  }

  return { ok: false as const, reason: "Could not allocate a code. Try again." };
}

/**
 * Resolves `/r/<code>` and counts the click.
 *
 * Returns the resource slug rather than a redirect, so the route decides what
 * to do with an unknown code — the library index, not a 404, because the
 * commonest cause is a caption typed with one character wrong.
 */
export async function resolveShortLink(code: string) {
  if (!/^[a-z0-9-]{3,24}$/.test(code)) return null;

  const link = await prisma.shortLink.findUnique({
    where: { code },
    include: { resource: { select: { slug: true, status: true } } },
  });
  if (!link) return null;

  /*
   * Fire-and-forget. A click that fails to record must never delay or break the
   * redirect — the visitor is mid-tap, and the number is decoration next to
   * them arriving where they were promised.
   */
  prisma.shortLink
    .update({
      where: { id: link.id },
      data: { clicks: { increment: 1 }, lastClickAt: new Date() },
    })
    .catch((error) => console.error("[resources] click count failed:", error));

  return { code: link.code, slug: link.resource.slug, published: link.resource.status === "PUBLISHED" };
}
