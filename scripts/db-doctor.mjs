/**
 * Works out how THIS machine can reach the database, and why it currently
 * can't. Run it on the machine that is failing — not in a CI runner, not in a
 * container that isn't the one running `next dev`.
 *
 *   npm run db:doctor
 */

import fs from "node:fs";
import net from "node:net";
import https from "node:https";
import dns from "node:dns";
import os from "node:os";

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
  console.error("\n  DATABASE_URL is not set (looked in the environment, .env and .env.local).\n");
  process.exit(1);
}

const { hostname, port } = new URL(url);
const isNeon = /\.neon\.tech$/.test(hostname);

console.log(`\n  node    : ${process.version}`);
console.log(`  platform: ${os.platform()} ${os.release()}`);
console.log(`  host    : ${hostname}`);
console.log(`  neon    : ${isNeon ? "yes" : "no"}`);

const proxyVars = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "NO_PROXY"]
  .filter((k) => process.env[k]);
console.log(`  proxy env: ${proxyVars.length ? proxyVars.map((k) => `${k}=${process.env[k]}`).join(", ") : "none set"}\n`);

const results = [];
const log = (r) => {
  results.push(r);
  const status = r.ok ? "OK  " : "FAIL";
  console.log(`  ${r.label.padEnd(34)} ${status}  ${String(r.ms).padStart(5)}ms  ${r.ok ? "" : r.detail}`);
};

/* DNS -------------------------------------------------------------------- */
const dnsResult = await new Promise((resolve) => {
  const started = Date.now();
  dns.resolve4(hostname, (e4, a4) => {
    dns.resolve6(hostname, (e6, a6) => {
      const ok = !e4 || !e6;
      resolve({
        label: "DNS resolution",
        ok,
        ms: Date.now() - started,
        detail: ok ? "" : `A: ${e4?.code}, AAAA: ${e6?.code}`,
        v4: e4 ? [] : a4,
        v6: e6 ? [] : a6,
      });
    });
  });
});
log(dnsResult);
if (dnsResult.v4?.length) console.log(`    A    (IPv4): ${dnsResult.v4.join(", ")}`);
if (dnsResult.v6?.length) console.log(`    AAAA (IPv6): ${dnsResult.v6.slice(0, 1).join(", ")}${dnsResult.v6.length > 1 ? " …" : ""}`);

/* 1 — raw TCP to 5432 ------------------------------------------------------ */
await new Promise((resolve) => {
  const started = Date.now();
  const socket = net.createConnection({ host: hostname, port: Number(port || 5432), timeout: 10_000 });
  const done = (ok, detail) => {
    log({ label: `TCP ${port || 5432} (raw socket)`, ok, detail, ms: Date.now() - started });
    socket.destroy();
    resolve();
  };
  socket.on("connect", () => done(true, ""));
  socket.on("timeout", () => done(false, "timed out — the port is being dropped somewhere on the path"));
  socket.on("error", (e) => done(false, e.code ?? e.message));
});

/* 2 — raw TCP to 443, then TLS -------------------------------------------- */
await new Promise((resolve) => {
  const started = Date.now();
  const req = https.get({ hostname, port: 443, path: "/", timeout: 10_000 }, (res) => {
    log({ label: "HTTPS 443 (node https, no SNI tricks)", ok: true, ms: Date.now() - started, detail: `status ${res.statusCode}` });
    res.destroy();
    resolve();
  });
  req.on("timeout", () => {
    log({ label: "HTTPS 443 (node https, no SNI tricks)", ok: false, ms: Date.now() - started, detail: "timed out — TCP connects but the TLS handshake never completes, or the whole thing hangs" });
    req.destroy();
    resolve();
  });
  req.on("error", (e) => {
    log({ label: "HTTPS 443 (node https, no SNI tricks)", ok: false, ms: Date.now() - started, detail: e.code ?? e.message });
    resolve();
  });
});

/* 3/4 — the actual drivers the app uses ------------------------------------ */
if (isNeon) {
  const started = Date.now();
  try {
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 12_000 });
    const r = await pool.query("select 1 as ok");
    await pool.end();
    log({ label: "Neon driver — WebSocket (ws)", ok: r.rows[0].ok === 1, ms: Date.now() - started, detail: "" });
  } catch (e) {
    log({ label: "Neon driver — WebSocket (ws)", ok: false, ms: Date.now() - started, detail: e?.message ?? String(e) });
  }

  const startedHttp = Date.now();
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const rows = await sql`select 1 as ok`;
    log({ label: "Neon driver — HTTP", ok: rows[0].ok === 1, ms: Date.now() - startedHttp, detail: "" });
  } catch (e) {
    log({ label: "Neon driver — HTTP", ok: false, ms: Date.now() - startedHttp, detail: e?.cause?.code ?? e?.message ?? String(e) });
  }
}

/* ── verdict ────────────────────────────────────────────────────────────── */
console.log("");
const working = results.filter((r) => r.ok && ["Neon driver — WebSocket (ws)", "Neon driver — HTTP", "TCP 5432 (raw socket)"].includes(r.label)).map((r) => r.label);

if (working.length > 0) {
  const preferred = working.includes("Neon driver — HTTP") ? "http" : working.includes("Neon driver — WebSocket (ws)") ? "ws" : "tcp";
  console.log(`  Working: ${working.join(", ")}`);
  console.log(`  Put this in .env.local:   DATABASE_TRANSPORT=${preferred}\n`);
  process.exit(0);
}

const tcpFailed = !results.find((r) => r.label.startsWith("TCP 5432"))?.ok;
const httpsFailed = !results.find((r) => r.label.startsWith("HTTPS 443"))?.ok;

console.log("  Nothing worked. Reading the table above:\n");
if (tcpFailed && httpsFailed) {
  console.log("  Both 5432 and 443 failed from Node, but check whether `curl` or a browser");
  console.log("  can reach the host — if they can and Node can't, something Node-specific is");
  console.log("  intercepting outbound connections: a VPN client, an antivirus/firewall doing");
  console.log("  TLS inspection, or a corporate proxy that isn't set in HTTP_PROXY/HTTPS_PROXY.");
  console.log("  Try: turning off any VPN, or running this on a different network (a phone");
  console.log("  hotspot) to isolate it in under a minute.\n");
} else if (tcpFailed && !httpsFailed) {
  console.log("  443 works but 5432 doesn't — a firewall is dropping the non-standard port.");
  console.log("  This is exactly what DATABASE_TRANSPORT=http or =ws works around.\n");
} else {
  console.log("  443 is blocked but 5432 isn't — unusual; a security appliance may be");
  console.log("  targeting HTTPS/WebSocket traffic specifically. DATABASE_TRANSPORT=tcp is");
  console.log("  the one left to try.\n");
}
console.log("  Also worth 30 seconds: open https://console.neon.tech and confirm the");
console.log("  project is not suspended — a paused Neon project fails exactly like this.\n");
process.exit(1);
