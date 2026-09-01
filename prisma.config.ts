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
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
