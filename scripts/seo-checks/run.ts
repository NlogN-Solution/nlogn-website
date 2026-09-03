/**
 * Runs every SEO check in one go: `npm run seo:check`.
 *
 * These cover the parts of the SEO dashboard where being wrong is expensive and
 * a type error would not catch it — the SSRF guard that decides which addresses
 * the crawler may reach, the encryption that protects stored OAuth tokens, the
 * date arithmetic behind every period comparison, and the polarity rules that
 * decide whether a change is painted green or red.
 *
 * Deliberately dependency-free rather than a test framework: the project has no
 * runner, and adding one to verify five modules would be a larger change than
 * the thing being verified. `scripts/db-doctor.mjs` is the same idea.
 */

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname);

// Prisma's client is constructed at import time and throws without a URL. None
// of these checks reaches the database, so a placeholder is enough.
process.env.DATABASE_URL ??= "postgresql://unused:unused@localhost:5432/unused";

const checks = readdirSync(directory)
  .filter((file) => file.endsWith(".check.ts"))
  .sort();

let failed = 0;

for (const check of checks) {
  const result = spawnSync("npx", ["tsx", path.join(directory, check)], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) failed += 1;
}

console.log(
  failed === 0
    ? `\nAll ${checks.length} check files passed.`
    : `\n${failed} of ${checks.length} check files failed.`,
);

process.exit(failed === 0 ? 0 : 1);
