import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Envelope encryption for provider credentials at rest.
 *
 * OAuth refresh tokens are long-lived bearer credentials for someone's Google
 * account — a database dump containing them in plaintext would be a far worse
 * incident than one containing this project's content. AES-256-GCM rather than
 * CBC because it authenticates as well as encrypts: a row edited in the
 * database fails to decrypt instead of silently yielding a different token.
 *
 * The key lives only in the server environment:
 *
 *   SEO_TOKEN_ENCRYPTION_KEY   32 random bytes, base64 — `openssl rand -base64 32`
 *
 * Rotating it invalidates every stored token, which shows up as NEEDS_REAUTH
 * on the integrations page and is fixed by reconnecting. That is deliberate:
 * failing closed is the only safe direction for a credential store.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const VERSION = "v1";

/** `undefined` = not yet read, `null` = read and absent. */
let cached: Buffer | null | undefined;

function encryptionKey(): Buffer | null {
  if (cached !== undefined) return cached;

  const raw = process.env.SEO_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    cached = null;
    return null;
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    // Thrown rather than ignored: a short key would still "work" and would
    // quietly weaken every token in the table.
    throw new Error(
      `SEO_TOKEN_ENCRYPTION_KEY must be ${KEY_BYTES} bytes of base64 (got ${key.length}). Generate one with: openssl rand -base64 32`,
    );
  }

  cached = key;
  return key;
}

/** Whether credentials can be stored at all. The settings page reads this. */
export function encryptionConfigured() {
  try {
    return encryptionKey() !== null;
  } catch {
    return false;
  }
}

/**
 * Returns `v1.<iv>.<tag>.<ciphertext>`, all base64url. Versioned so a future
 * algorithm change can decrypt old rows rather than orphan them.
 */
export function encryptSecret(plaintext: string): string {
  const key = encryptionKey();
  if (!key) {
    throw new Error(
      "Refusing to store a credential: SEO_TOKEN_ENCRYPTION_KEY is not set.",
    );
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/**
 * Reverses `encryptSecret`. Returns null rather than throwing on anything
 * malformed — a token that cannot be decrypted is a reconnect prompt, not a
 * 500, and callers already handle a missing credential.
 */
export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;

  try {
    const key = encryptionKey();
    if (!key) return null;

    const [version, iv, tag, ciphertext] = payload.split(".");
    if (version !== VERSION || !iv || !tag || !ciphertext) return null;

    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Wrong key, tampered row, or a format from before a rotation.
    return null;
  }
}
