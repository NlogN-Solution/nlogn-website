import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF protection for anything that fetches a URL the application did not write.
 *
 * A crawler is a request forgery primitive by definition: it takes an address
 * and makes the server fetch it. Without this, a stored domain of
 * `169.254.169.254` turns the audit button into a cloud-metadata credential
 * reader, and `localhost:5432` into a port scanner of our own infrastructure.
 *
 * The defence is layered, because each layer alone is bypassable:
 *
 *  1. Scheme and port allow-lists — http/https on 80/443 only, so no
 *     `file://`, `gopher://` or arbitrary internal service ports.
 *  2. Hostname resolution, then rejection of every private, loopback,
 *     link-local, carrier-grade-NAT, multicast and reserved range, v4 and v6.
 *     Checking the *hostname* is not enough: a public name can resolve to
 *     127.0.0.1, which is the classic DNS-rebinding bypass.
 *  3. Redirects followed manually, one hop at a time, re-validating each. A
 *     public URL that 302s to the metadata service is otherwise a free pass.
 *  4. Response size and time ceilings, so a hostile target cannot exhaust us.
 *
 * The crawler additionally refuses to leave the website's own registered domain
 * — see `sameSite` in `crawler.service.ts`. That is scope control rather than
 * SSRF defence, and both are needed.
 */

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_PORTS = new Set(["", "80", "443"]);

/** Ranges that must never be reachable from a server-side fetch. */
function isBlockedIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 || // "this network"
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local — AWS/GCP metadata lives here
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    (a === 192 && b === 0) || // IETF protocol assignments
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    (a === 198 && b === 51) || // TEST-NET-2
    (a === 203 && b === 0) || // TEST-NET-3
    a >= 224 // multicast and reserved, through 255.255.255.255
  );
}

function isBlockedIpv6(address: string): boolean {
  const value = address.toLowerCase().split("%")[0];

  // An IPv4-mapped address (::ffff:169.254.169.254) is an IPv4 destination
  // wearing a v6 hat, and must be judged by the v4 rules.
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);

  if (value === "::" || value === "::1") return true;

  const prefix = value.slice(0, 2);
  return (
    prefix === "fc" || // unique local
    prefix === "fd" || // unique local
    value.startsWith("fe8") || // link-local
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    prefix === "ff" // multicast
  );
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family === 6) return isBlockedIpv6(address);
  return true;
}

/**
 * Validates a URL and proves its hostname resolves somewhere public.
 *
 * Returns the parsed URL. Throws `BlockedUrlError` with a message safe to show
 * an admin — it names what was refused without echoing internal topology.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BlockedUrlError("That is not a valid URL.");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new BlockedUrlError("Only http and https addresses can be checked.");
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    throw new BlockedUrlError("Only the standard web ports (80 and 443) can be checked.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  // A literal IP skips DNS entirely, so check it directly.
  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new BlockedUrlError("That address is on a private or reserved network.");
    }
    return url;
  }

  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new BlockedUrlError("That address is on a private or reserved network.");
  }

  let addresses: { address: string }[];
  try {
    // `all: true` matters: a host with one public and one loopback record must
    // be refused, not accepted on whichever the resolver happened to return.
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new BlockedUrlError("That domain could not be resolved.");
  }

  if (addresses.length === 0) {
    throw new BlockedUrlError("That domain could not be resolved.");
  }

  if (addresses.some((entry) => isBlockedAddress(entry.address))) {
    throw new BlockedUrlError("That address resolves to a private or reserved network.");
  }

  return url;
}

export type SafeFetchResult = {
  url: string;
  status: number;
  headers: Headers;
  body: string;
  /** Bytes actually received, after the ceiling was applied. */
  bytes: number;
  /** Milliseconds until the first byte. */
  ttfb: number;
  /** Every URL in the redirect chain, in order. */
  redirects: string[];
};

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 15_000;

const USER_AGENT =
  "nlogn-seo-audit/1.0 (+https://nlogn.com; site owner's own audit tool)";

/**
 * A fetch that cannot be pointed at private infrastructure.
 *
 * Redirects are followed by hand rather than by `fetch`, because
 * `redirect: "follow"` would resolve and connect to each hop without giving us
 * a chance to check it.
 */
export async function safeFetch(
  raw: string,
  { method = "GET" }: { method?: "GET" | "HEAD" } = {},
): Promise<SafeFetchResult> {
  const redirects: string[] = [];
  let target = raw;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const url = await assertPublicUrl(target);
    const started = Date.now();

    const response = await fetch(url, {
      method,
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const ttfb = Date.now() - started;

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          url: url.toString(),
          status: response.status,
          headers: response.headers,
          body: "",
          bytes: 0,
          ttfb,
          redirects,
        };
      }

      redirects.push(url.toString());
      target = new URL(location, url).toString();
      continue;
    }

    const body = method === "HEAD" ? "" : await readCapped(response);

    return {
      url: url.toString(),
      status: response.status,
      headers: response.headers,
      body,
      bytes: method === "HEAD" ? Number(response.headers.get("content-length") ?? 0) : body.length,
      ttfb,
      redirects,
    };
  }

  throw new BlockedUrlError("That address redirects too many times.");
}

/**
 * Reads a response body up to a ceiling, so a malicious or misconfigured target
 * cannot stream gigabytes into the process. Truncation is fine here — the
 * checks that follow read the `<head>` and count links, neither of which needs
 * the tail of a three-megabyte document.
 */
async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(decoder.decode(value, { stream: true }));
      if (total >= MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
        break;
      }
    }
  } catch {
    // A truncated read still yields useful markup — return what arrived.
  }

  return chunks.join("");
}
