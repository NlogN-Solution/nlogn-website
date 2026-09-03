import { isBlockedAddress, assertPublicUrl, BlockedUrlError } from "@/server/net-guard";

let pass = 0, fail = 0;

async function main() {

const check = (name: string, ok: boolean, extra = "") => {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

console.log("\nIP range blocking");
const blocked = [
  "127.0.0.1", "10.0.0.1", "172.16.5.4", "172.31.255.255", "192.168.1.1",
  "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
  "198.18.0.1", "192.0.2.1", "203.0.113.9",
  "::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1",
  "::ffff:127.0.0.1", "::ffff:169.254.169.254",
];
for (const ip of blocked) check(`blocks ${ip}`, isBlockedAddress(ip) === true);

const allowed = ["8.8.8.8", "1.1.1.1", "142.250.185.78", "172.32.0.1", "172.15.0.1", "2606:4700::1111"];
for (const ip of allowed) check(`allows ${ip}`, isBlockedAddress(ip) === false);

console.log("\nURL guard");
const mustReject = [
  "file:///etc/passwd",
  "gopher://example.com",
  "http://localhost/admin",
  "http://127.0.0.1:8080/",
  "https://example.com:22/",
  "http://169.254.169.254/latest/meta-data/",
  "https://foo.localhost/",
  "https://printer.local/",
  "not a url",
];
for (const url of mustReject) {
  const result = await assertPublicUrl(url).then(() => "allowed").catch((e) => e instanceof BlockedUrlError ? "blocked" : `other:${e}`);
  check(`rejects ${url}`, result === "blocked", `got ${result}`);
}

const mustAllow = ["https://example.com/", "https://www.google.com/search"];
for (const url of mustAllow) {
  const result = await assertPublicUrl(url).then(() => "allowed").catch((e) => `blocked:${e.message}`);
  check(`allows ${url}`, result === "allowed", `got ${result}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
}

void main();
