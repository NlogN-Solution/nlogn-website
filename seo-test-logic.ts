import { randomBytes } from "node:crypto";
process.env.SEO_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");

import { encryptSecret, decryptSecret, encryptionConfigured } from "@/server/crypto";
import { buildRange, parseRange, addDays, daysBetween, latestAvailableDay } from "@/lib/date-range";
import { compare, formatDelta } from "@/lib/metrics";
import { findOpportunities } from "@/server/services/seo-opportunities.service";
import { calculateHealth } from "@/server/services/seo-health.service";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

console.log("\nToken encryption");
check("configured", encryptionConfigured());
const secret = "1//0gRefreshTokenExample_with-symbols.and~stuff";
const sealed = encryptSecret(secret);
check("round-trips", decryptSecret(sealed) === secret);
check("ciphertext differs from plaintext", !sealed.includes(secret));
check("two encryptions differ (random IV)", encryptSecret(secret) !== encryptSecret(secret));
check("rejects tampered payload", decryptSecret(sealed.slice(0, -4) + "AAAA") === null);
check("rejects garbage", decryptSecret("nonsense") === null);
check("null in, null out", decryptSecret(null) === null);

console.log("\nDate ranges");
const now = new Date("2026-09-03T12:00:00Z");
const r28 = buildRange("28d", { now });
check("28d current is 28 days", r28.current.days === 28 && daysBetween(r28.current.start, r28.current.end) === 28);
check("28d previous is 28 days", daysBetween(r28.previous.start, r28.previous.end) === 28);
check("previous ends day before current starts", addDays(r28.previous.end, 1) === r28.current.start);
check("ends yesterday, not today", r28.current.end === "2026-09-02", r28.current.end);
check("no overlap", r28.previous.end < r28.current.start);

const lagged = buildRange("7d", { now, lagDays: 3 });
check("lag shifts the window back", lagged.current.end === "2026-08-30", lagged.current.end);
check("lag keeps both windows equal", daysBetween(lagged.current.start, lagged.current.end) === daysBetween(lagged.previous.start, lagged.previous.end));

const r12 = buildRange("12m", { now });
check("12m and its previous are both 365 days", r12.current.days === 365 && daysBetween(r12.previous.start, r12.previous.end) === 365);

check("bad preset falls back to default", parseRange(new URLSearchParams("range=nonsense"), { now }).preset === "28d");
check("custom range parsed", parseRange(new URLSearchParams("range=custom&start=2026-01-01&end=2026-01-31"), { now }).current.days === 31);
check("reversed custom range falls back", parseRange(new URLSearchParams("range=custom&start=2026-02-01&end=2026-01-01"), { now }).preset === "28d");
const clamped = parseRange(new URLSearchParams("range=custom&start=2010-01-01&end=2026-09-01"), { now });
check("custom range clamped to 16 months", clamped.current.start > "2025-01-01", clamped.current.start);

console.log("\nDelta polarity");
const clicksUp = compare(1284, 1088);
check("more clicks is positive", clicksUp.direction === "up" && clicksUp.sentiment === "positive");
const posUp = compare(14.8, 12.7, "lower-is-better");
check("worse position is negative sentiment", posUp.direction === "up" && posUp.sentiment === "negative");
const posDown = compare(12.7, 14.8, "lower-is-better");
check("better position is positive sentiment", posDown.direction === "down" && posDown.sentiment === "positive");
check("position delta reads in positions", formatDelta(posDown, "position") === "↓ 2.1 positions", formatDelta(posDown, "position"));
check("ctr delta reads in points", formatDelta(compare(0.034, 0.030), "rate") === "↑ 0.40 percentage points", formatDelta(compare(0.034, 0.030), "rate"));
check("growth from zero has null pct", compare(50, 0).changePct === null);
check("flat is neutral", compare(10, 10).sentiment === "neutral");

console.log("\nOpportunities");
const keywords = [
  { keyword: "web development nepal", clicks: 12, impressions: 3200, ctr: 0.00375, position: 12.4, positionChange: -0.5, previousPosition: 12.9 },
  { keyword: "software company nepal", clicks: 118, impressions: 8420, ctr: 0.014, position: 7.2, positionChange: 0.2, previousPosition: 7.0 },
  { keyword: "slipping term", clicks: 5, impressions: 900, ctr: 0.0055, position: 22.0, positionChange: 9.0, previousPosition: 13.0 },
  ...Array.from({ length: 12 }, (_, i) => ({
    keyword: `filler ${i}`, clicks: 30 + i, impressions: 600 + i * 40,
    ctr: 0.05, position: 7 + (i % 3), positionChange: 0, previousPosition: 7 + (i % 3),
  })),
];
const { opportunities, benchmarkAvailable } = findOpportunities(keywords, []);
check("benchmark computed from the site's own data", benchmarkAvailable);
const kinds = new Set(opportunities.map((o) => o.kind));
check("finds close-to-page-one", kinds.has("close-to-page-one"));
check("finds high-impressions-low-ctr", kinds.has("high-impressions-low-ctr"));
check("finds declining", kinds.has("declining"));
check("every opportunity states its basis", opportunities.every((o) => o.basis.length > 20));
check("ranked by score, descending", opportunities.every((o, i, a) => i === 0 || a[i - 1].score >= o.score));

const empty = findOpportunities([], []);
check("no keywords yields no opportunities", empty.opportunities.length === 0 && !empty.benchmarkAvailable);

console.log("\nHealth score");
const none = calculateHealth({ issues: null, crawled: false, clicks: null, position: null, ctr: null, performanceScore: null, organicUsers: null });
check("no inputs yields null, not zero", none.score === null && none.grade === "Not enough data");
check("no inputs reports 0 of 5 measured", none.measured === 0 && none.possible === 5);

const partial = calculateHealth({
  issues: null, crawled: false,
  clicks: compare(1284, 1088), position: compare(12.7, 14.8, "lower-is-better"), ctr: compare(0.03, 0.028),
  performanceScore: null, organicUsers: null,
});
check("partial inputs still score 0-100", partial.score !== null && partial.score >= 0 && partial.score <= 100, String(partial.score));
check("partial reports how many measures were used", partial.measured === 2, String(partial.measured));
check("components sum is re-weighted, not capped", partial.score! > 40, String(partial.score));
check("disclaimer always present", partial.disclaimer.includes("not a Google or Ahrefs score"));

const clean = calculateHealth({
  issues: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, crawled: true,
  clicks: compare(1284, 1000), position: compare(8, 12, "lower-is-better"), ctr: compare(0.05, 0.04),
  performanceScore: 96, organicUsers: compare(2140, 1630),
});
check("healthy site scores high", clean.score !== null && clean.score >= 85, String(clean.score));
check("all five measured", clean.measured === 5);

const broken = calculateHealth({
  issues: { CRITICAL: 4, HIGH: 10, MEDIUM: 20, LOW: 30 }, crawled: true,
  clicks: compare(500, 1200), position: compare(28, 15, "lower-is-better"), ctr: compare(0.004, 0.02),
  performanceScore: 21, organicUsers: compare(300, 900),
});
check("broken site scores low", broken.score !== null && broken.score < 35, String(broken.score));
check("crawled-but-zero-issues beats never-crawled", clean.components.some((c) => c.key === "technical"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
