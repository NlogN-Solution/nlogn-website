import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon, PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma";

/**
 * The Prisma client, as a singleton.
 *
 * Next.js reloads modules on every edit in development, which would otherwise
 * open a new connection pool per reload until the database refuses more. The
 * global cache keeps one pool across reloads; in production the module is
 * evaluated once anyway.
 *
 * Three transports. A Neon URL defaults to `http`; anything else to `tcp`.
 * Override with DATABASE_TRANSPORT when a network disagrees — `npm run
 * db:doctor` reports which of the three this machine can actually use.
 *
 *   ws   Neon over WebSockets on 443. Nothing needs to be open on 5432, which
 *        matters on networks that block non-standard outbound ports, and it is
 *        the right transport for serverless hosting where a TCP pool cannot be
 *        kept warm anyway.
 *   http Neon SQL over plain HTTPS POSTs. The default for Neon: it is the most
 *        firewall-tolerant option, with no WebSocket upgrade for a proxy to
 *        refuse. Its one limitation is no interactive transactions, and this
 *        codebase uses none — check with `grep -r '$transaction' src` before
 *        that stops being true.
 *   tcp  node-postgres over 5432, for a local container, RDS or any other
 *        Postgres.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Fail fast rather than letting a page hang for half a minute on a dead host. */
const CONNECT_TIMEOUT_MS = Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 10_000);

/**
 * Connections this process may open on the `tcp` transport.
 *
 * node-postgres defaults to 10, which is wrong at both ends of this codebase.
 * `next build` forks three workers that each construct their own client, so the
 * default asks for 30 — past the 15 a Supabase session-mode pooler allows, and
 * the build fills the log with EMAXCONNSESSION and prerenders fallbacks. On
 * serverless every instance is its own process, so a large pool is wasted there
 * too: one connection per instance is the shape that scales.
 *
 * Three is enough for a page render's handful of parallel reads while leaving
 * headroom for a second worker. Raise it with DATABASE_POOL_MAX behind a pooler
 * that permits more (`connection_limit` in the URL is a Prisma-engine parameter
 * and is ignored — the pool is built here, so the ceiling has to be set here).
 */
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 3);

type Transport = "ws" | "http" | "tcp";

function chooseTransport(connectionString: string): Transport {
  const forced = process.env.DATABASE_TRANSPORT;
  if (forced === "ws" || forced === "http" || forced === "tcp") return forced;
  return /\.neon\.tech(:|\/|$)/.test(connectionString) ? "http" : "tcp";
}

function createAdapter(connectionString: string) {
  const transport = chooseTransport(connectionString);

  if (transport === "ws") {
    return new PrismaNeon({ connectionString, connectionTimeoutMillis: CONNECT_TIMEOUT_MS });
  }

  if (transport === "http") {
    return new PrismaNeonHttp(connectionString, {});
  }

  /*
   * The pool is built here rather than letting the adapter build one, purely so
   * an `error` handler can be attached. node-postgres emits `error` on the Pool
   * when an idle client dies, and an EventEmitter `error` with no listener is a
   * hard process crash — a database blip would otherwise take the whole server
   * down, which is precisely what every fallback in this codebase exists to
   * prevent.
   */
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    max: POOL_MAX,
  });
  pool.on("error", (error) => {
    console.error("[db] idle client error (connection dropped, not fatal):", error.message);
  });

  return new PrismaPg(pool);
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. The CMS needs it; the public site's static content does not.",
    );
  }

  return new PrismaClient({
    adapter: createAdapter(connectionString),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (client) return client;
  client = globalForPrisma.prisma ?? createClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * The client, constructed on first use rather than on import.
 *
 * `createClient()` throws when DATABASE_URL is missing, and every public page
 * reaches this module through `dbRead`. Building the client at module scope
 * made that throw fire at *import* time, which no `dbRead` fallback can catch —
 * one unset variable would take the whole marketing site down instead of
 * degrading it to committed content. Deferring to first property access keeps
 * the failure inside the try/catch that was written for it.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const value = Reflect.get(getClient(), property) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** True when the CMS can run at all. Public pages use this to stay up without a database. */
export const databaseConfigured = Boolean(process.env.DATABASE_URL);

/* ── circuit breaker ─────────────────────────────────────────────────────── */

/**
 * Stops every request paying the connection timeout when the database is down.
 *
 * Without this, a public page render waits the full timeout, fails, falls back
 * to static content, and the next request does it all again — the site stays up
 * but every page takes ten seconds. After a few consecutive failures the
 * breaker opens and reads return their fallback immediately; it closes again on
 * the first success after the cool-off.
 */
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 30_000;

const breaker = { failures: 0, openedAt: 0 };

function breakerIsOpen() {
  if (breaker.failures < BREAKER_THRESHOLD) return false;
  if (Date.now() - breaker.openedAt > BREAKER_COOLDOWN_MS) {
    // Cool-off elapsed: let one request through to test the water.
    breaker.failures = 0;
    return false;
  }
  return true;
}

/**
 * Runs a database read, returning `fallback` if it fails or if the breaker is
 * open. Every public-facing read goes through this: a CMS outage must degrade
 * the site to its committed content, never take it down.
 */
export async function dbRead<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  if (!databaseConfigured) return fallback;

  if (breakerIsOpen()) return fallback;

  try {
    const result = await fn();
    breaker.failures = 0;
    return result;
  } catch (error) {
    breaker.failures += 1;
    if (breaker.failures === BREAKER_THRESHOLD) {
      breaker.openedAt = Date.now();
      console.error(
        `[db] ${BREAKER_THRESHOLD} consecutive failures — serving fallbacks for ${BREAKER_COOLDOWN_MS / 1000}s`,
      );
    }
    console.error(`[db] ${label} failed:`, error instanceof Error ? error.message : error);
    return fallback;
  }
}
