import fs from "node:fs";
import path from "node:path";

/**
 * Loads `.env` then `.env.local`, the way `next` does.
 *
 * Neither the Prisma CLI nor `tsx` does this on its own, and Node's
 * `--env-file-if-exists` proved unreliable through `tsx` — it forwarded the
 * flag several times and reported the wrong filename. Reading the files here
 * removes the guesswork: whatever this function loads is what the tooling sees.
 *
 * Variables already present in the environment always win, so
 * `DATABASE_URL=… npm run db:seed` still overrides the file.
 */
export function loadEnv(cwd = process.cwd()) {
  for (const file of [".env", ".env.local"]) {
    const full = path.join(cwd, file);
    if (!fs.existsSync(full)) continue;

    for (const line of fs.readFileSync(full, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      // Strip one layer of matching quotes, keep everything else — including
      // the spaces that appear in app passwords.
      process.env[key] = raw.replace(/^(['"])([\s\S]*)\1$/, "$2").trim();
    }
  }
}
