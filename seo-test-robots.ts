import { parseRobots } from "@/server/integrations/robots";
import { toPublicConnection } from "@/server/services/seo-connection.service";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

console.log("\nrobots.txt");
const rules = parseRobots(`
# comment
User-agent: *
Disallow: /admin
Disallow: /private/
Allow: /private/public-bit
Crawl-delay: 2

User-agent: BadBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/news-sitemap.xml
`);

check("detects the file exists", rules.exists);
check("collects both sitemaps", rules.sitemaps.length === 2);
check("reads crawl-delay", rules.crawlDelay === 2);
check("blocks /admin", !rules.isAllowed("/admin"));
check("blocks /admin/users", !rules.isAllowed("/admin/users"));
check("blocks /private/secret", !rules.isAllowed("/private/secret"));
check("Allow beats Disallow on a longer match", rules.isAllowed("/private/public-bit"));
check("allows everything else", rules.isAllowed("/blog/post"));
check("allows the root", rules.isAllowed("/"));

const wildcards = parseRobots(`
User-agent: *
Disallow: /*.pdf$
Disallow: /search?
`);
check("wildcard + end anchor blocks /file.pdf", !wildcards.isAllowed("/file.pdf"));
check("end anchor does not block /file.pdf.html", wildcards.isAllowed("/file.pdf.html"));
check("prefix blocks /search?q=x", !wildcards.isAllowed("/search?q=x"));

const empty = parseRobots(`
User-agent: *
Disallow:
`);
check("empty Disallow permits everything", empty.isAllowed("/anything"));

const specific = parseRobots(`
User-agent: *
Disallow: /

User-agent: nlogn-seo-audit
Disallow: /nope
`, "nlogn-seo-audit");
check("a group naming us wins over the wildcard", specific.isAllowed("/yes"));
check("...and its own rules still apply", !specific.isAllowed("/nope"));

const grouped = parseRobots(`
User-agent: googlebot
User-agent: nlogn-seo-audit
Disallow: /shared-block
`, "nlogn-seo-audit");
check("consecutive user-agent lines share a group", !grouped.isAllowed("/shared-block"));

console.log("\nCredential leakage");
const row = {
  id: "c1", websiteId: "w1", provider: "GOOGLE_SEARCH_CONSOLE",
  status: "CONNECTED", accountLabel: "someone@example.com", scopes: ["a"],
  encryptedAccessToken: "v1.AAAA.BBBB.SUPERSECRETACCESS",
  encryptedRefreshToken: "v1.CCCC.DDDD.SUPERSECRETREFRESH",
  accessTokenExpiresAt: new Date(), lastSyncedAt: new Date(), lastSyncError: null,
  capabilities: null, createdAt: new Date(), updatedAt: new Date(),
} as never;

const serialised = JSON.stringify(toPublicConnection(row));
check("no access token in the public shape", !serialised.includes("SUPERSECRETACCESS"), serialised);
check("no refresh token in the public shape", !serialised.includes("SUPERSECRETREFRESH"));
check("no encrypted* keys at all", !serialised.includes("encrypted"));
check("still reports status", serialised.includes("CONNECTED"));
check("still reports the account", serialised.includes("someone@example.com"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
