import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnv } from "./prisma/env";

// The Prisma CLI does not read .env.local; without this, `prisma migrate`
// reports an empty connection URL, which looks like a credentials problem and
// is not.
loadEnv();

/**
 * Prisma 7 reads the migration connection URL from here rather than from the
 * schema. The runtime client does not use this file at all — it takes a driver
 * adapter instead (see src/server/db.ts).
 *
 * Neither the Prisma CLI nor `tsx` loads `.env.local` the way `next` does, so
 * this file loads it. Without that, `prisma migrate` reports an empty
 * connection URL and the seed script fails with a SASL error about a missing
 * password — both of which look like credential problems and are not.
 */

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    /*
     * DIRECT_URL first, and DATABASE_URL only as a fallback.
     *
     * DATABASE_URL is Supabase's transaction pooler (port 6543), which is right
     * for the application and wrong for this: the migration engine takes a
     * session-level advisory lock and creates a shadow database, and neither
     * survives a connection that is handed to somebody else between statements
     * — `prisma migrate` simply hangs. DIRECT_URL is the session-mode URL on
     * 5432, which is what migrations need and the only thing that needs it.
     */
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
