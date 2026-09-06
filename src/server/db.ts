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

/**
 * True while `next build` is prerendering, false in a running server. Next sets
 * NEXT_PHASE for the build process and its render workers.
 */
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

/**
 * How long a query may wait for a connection.
 *
 * node-postgres counts the wait for a free pool slot in this too, not just the
 * TCP and TLS handshake — so on a pooler a couple of hundred milliseconds away,
 * a page render's parallel reads queue behind however many connections
 * `POOL_MAX` allows, and the last one in the queue pays for all of them.
 *
 * Ten seconds is right for a request: somebody is waiting on it, and a page
 * that degrades to committed content beats one that hangs. It is the wrong
 * number for a build, where nobody is waiting and the cost of giving up is a
 * failed deployment — so the build gets three times as long before it decides
 * the database is unreachable.
 */
const CONNECT_TIMEOUT_MS = Number(
  process.env.DATABASE_CONNECT_TIMEOUT_MS ?? (isBuild ? 30_000 : 10_000),
);

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

/**
 * Supabase's pooler answers on two ports, and only one of them works here.
 *
 * 6543 is transaction mode: connections are multiplexed, so a few hundred
 * clients share a handful of Postgres backends. 5432 is session mode, which
 * pins one backend per client and caps the whole project at 15 — and `next
 * build` forks render workers that each construct their own pool, while every
 * serverless instance in production does the same. The result is a build that
 * dies partway through page generation with `(EMAXCONNSESSION) max clients
 * reached in session mode`.
 *
 * The two URLs are identical apart from the port, so this is an easy variable
 * to paste wrong and a miserable one to diagnose from the error alone — which
 * is why the message below spells out the fix rather than the symptom.
 */
const SESSION_POOLER_FIX =
  "DATABASE_URL is Supabase's session-mode pooler (port 5432). It allows only 15 client " +
  "connections in total, and both `next build` and serverless rendering open more than that. " +
  "Change the port to 6543 and keep the query string: " +
  "?pgbouncer=true&sslmode=no-verify — that is the transaction pooler, which multiplexes. " +
  "Leave the 5432 URL in DIRECT_URL: `prisma migrate` needs session mode and is the only " +
  "thing that does.";

/** True for a Supabase pooler URL on the session-mode port. */
function isSessionModePooler(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    return url.hostname.includes("pooler.supabase.com") && url.port === "5432";
  } catch {
    // Not a URL this can parse is not a URL this can judge.
    return false;
  }
}

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

  if (isSessionModePooler(connectionString)) {
    /*
     * Fatal during a build and a warning at runtime, for the same reason
     * `dbRead` rethrows during a build: a build that continues here produces a
     * deployment, and this configuration cannot finish one. A server already
     * running is better off trying — some requests will get through, and the
     * log now says what to change.
     */
    if (isBuild) throw new Error(`[db] ${SESSION_POOLER_FIX}`);
    console.error(`[db] ${SESSION_POOLER_FIX}`);
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
 * Squeezes a multi-line error message onto one line.
 *
 * Prisma messages open with a newline and are indented over several lines, so
 * a log reads `Cause:` followed by blank space — which is what made the real
 * failure look absent in the first place. Build logs are line-oriented; one
 * line keeps the cause attached to the label that introduces it.
 */
function flatten(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

/**
 * The message a Prisma error actually carries.
 *
 * A driver-adapter failure surfaces as P2039 with the real cause tucked into
 * `meta.driverAdapterError`, which prints as a bare `[Error]` — so a build log
 * says only "External connector error" and the TLS handshake, DNS or auth
 * failure underneath it is invisible. This unwraps the chain so the log names
 * the thing that has to be fixed.
 */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return flatten(String(error));

  const parts = [flatten(error.message)];

  const meta = (error as { meta?: Record<string, unknown> }).meta;
  const adapterError = meta?.driverAdapterError;
  if (adapterError instanceof Error) {
    parts.push(`driverAdapterError: ${flatten(adapterError.message)}`);
    const code = (adapterError as { code?: unknown }).code;
    if (code) parts.push(`code: ${String(code)}`);
  } else if (adapterError) {
    parts.push(`driverAdapterError: ${flatten(JSON.stringify(adapterError))}`);
  }

  for (let cause = error.cause; cause instanceof Error; cause = cause.cause) {
    parts.push(`caused by: ${flatten(cause.message)}`);
  }

  // The pooler can reach its ceiling on a URL the check above did not recognise
  // — a self-hosted Supavisor, say. The symptom names the fix either way.
  const joined = parts.join(" ");
  if (joined.includes("EMAXCONNSESSION") || joined.includes("max clients reached in session mode")) {
    parts.push(`fix: ${SESSION_POOLER_FIX}`);
  }

  return parts.filter(Boolean).join(" | ");
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
    console.error(`[db] ${label} failed:`, describe(error));

    /*
     * A fallback at request time is the whole point of this wrapper: the page
     * degrades and the next request tries again. A fallback during `next build`
     * is a different thing entirely — it is baked into a prerendered page and
     * served until the revalidate window elapses, or forever for a fully static
     * route. That produced a green deployment serving content the CMS does not
     * have, with nothing but a swallowed message in the build log to say so.
     *
     * So during a build the failure is loud, and DATABASE_FALLBACK_AT_BUILD=1
     * is the deliberate opt-out for building without a reachable database.
     */
    if (isBuild && process.env.DATABASE_FALLBACK_AT_BUILD !== "1") {
      throw new Error(
        `[db] ${label} failed during the build, which would prerender fallback content into a ` +
          `deployment. Fix the connection, or set DATABASE_FALLBACK_AT_BUILD=1 to build without ` +
          `a database. Cause: ${describe(error)}`,
        { cause: error },
      );
    }

    return fallback;
  }
}
