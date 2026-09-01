/**
 * Works out how this machine can actually reach the database.
 *
 * Neon is reachable three different ways, and which of them a given network
 * allows varies — some ISPs and corporate firewalls block outbound 5432, some
 * proxies break WebSocket upgrades. Rather than guess, this tries all three and
 * tells you which to put in DATABASE_TRANSPORT.
 *
 *   npm run db:doctor
 */

import fs from "node:fs";
import net from "node:net";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])([\s\S]*)\1$/, "$2").trim();
  }
}
loadEnv(".env");
loadEnv(".env.local");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (looked in the environment, .env and .env.local).");
  process.exit(1);
}

const { hostname, port } = new URL(url);
const isNeon = /\.neon\.tech$/.test(hostname);

console.log(`\n  Host: ${hostname}`);
console.log(`  Neon: ${isNeon ? "yes" : "no"}\n`);

const results = [];

/* 1 ── plain Postgres over TCP ------------------------------------------- */
await new Promise((resolve) => {
  const started = Date.now();
  const socket = net.createConnection({ host: hostname, port: Number(port || 5432), timeout: 10_000 });
  const done = (ok, detail) => {
    results.push({ name: "tcp", label: `TCP ${port || 5432} (node-postgres)`, ok, detail, ms: Date.now() - started });
    socket.destroy();
    resolve();
  };
  socket.on("connect", () => done(true, "port open"));
  socket.on("timeout", () => done(false, "timed out — the port is probably blocked"));
  socket.on("error", (e) => done(false, e.code ?? e.message));
});

/* 2 ── Neon over WebSockets (443) ----------------------------------------- */
if (isNeon) {
  const started = Date.now();
  try {
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 12_000 });
    const r = await pool.query("select 1 as ok");
    await pool.end();
    results.push({ name: "ws", label: "WebSocket 443 (Neon driver)", ok: r.rows[0].ok === 1, detail: "query returned", ms: Date.now() - started });
  } catch (e) {
    results.push({ name: "ws", label: "WebSocket 443 (Neon driver)", ok: false, detail: e?.message ?? String(e), ms: Date.now() - started });
  }

  /* 3 ── Neon over plain HTTPS (443) -------------------------------------- */
  const startedHttp = Date.now();
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const rows = await sql`select 1 as ok`;
    results.push({ name: "http", label: "HTTPS 443 (Neon SQL over HTTP)", ok: rows[0].ok === 1, detail: "query returned", ms: Date.now() - startedHttp });
  } catch (e) {
    results.push({ name: "http", label: "HTTPS 443 (Neon SQL over HTTP)", ok: false, detail: e?.cause?.code ?? e?.message ?? String(e), ms: Date.now() - startedHttp });
  }
}

console.log("  Transport                        Result");
console.log("  ─────────────────────────────────────────────────────────────");
for (const r of results) {
  console.log(`  ${r.label.padEnd(32)} ${r.ok ? "OK  " : "FAIL"}  ${String(r.ms).padStart(5)}ms  ${r.ok ? "" : r.detail}`);
}

const working = results.filter((r) => r.ok).map((r) => r.name);
console.log("");

if (working.length === 0) {
  console.log("  Nothing could reach the database.");
  console.log("  Check the Neon dashboard (is the project active?) and try a different");
  console.log("  network — a phone hotspot is the quickest way to rule out the ISP.\n");
  process.exit(1);
}

// http first: it is the app's default for Neon and the most firewall-tolerant.
const preferred = working.includes("http") ? "http" : working.includes("ws") ? "ws" : "tcp";
console.log(`  Working: ${working.join(", ")}`);
console.log(`  Use:     DATABASE_TRANSPORT=${preferred}\n`);
