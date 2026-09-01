import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon, PrismaNeonHttp } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";
import { loadEnv } from "./env";

// `tsx` does not read .env.local; this does, before anything touches the URL.
loadEnv();

/**
 * First-run setup.
 *
 * Safe to run more than once: every write is an upsert, and an existing admin
 * account is never overwritten — re-seeding a live database must not reset
 * somebody's password.
 *
 *   ADMIN_EMAIL / ADMIN_PASSWORD   the first super admin
 *
 * With no ADMIN_PASSWORD a strong one is generated and printed once. It is not
 * stored anywhere else, so copy it before closing the terminal.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "\n  DATABASE_URL is not set.\n" +
      "  Looked in the environment, .env and .env.local (from " +
      process.cwd() +
      ").\n",
  );
  process.exit(1);
}

// Same transport choice as the app — see src/server/db.ts.
function adapter() {
  const forced = process.env.DATABASE_TRANSPORT;
  const isNeon = /\.neon\.tech(:|\/|$)/.test(connectionString!);
  const transport = forced ?? (isNeon ? "http" : "tcp");

  console.log(`  Transport: ${transport}`);

  if (transport === "ws") return new PrismaNeon({ connectionString: connectionString! });
  if (transport === "http") return new PrismaNeonHttp(connectionString!, {});
  return new PrismaPg({ connectionString: connectionString! });
}

const prisma = new PrismaClient({ adapter: adapter() });

const DEFAULT_SETTINGS: { key: string; value: unknown; group: string }[] = [
  { key: "siteName", value: "nlogn", group: "general" },
  { key: "contactEmail", value: "nlognweb@gmail.com", group: "general" },
  { key: "contactPhone", value: "+9747745188", group: "general" },
  { key: "whatsappNumber", value: "9779747745188", group: "contact" },
  { key: "address", value: "Koteswor, Kathmandu", group: "general" },
  { key: "sendAcknowledgement", value: true, group: "contact" },
  { key: "notificationRecipients", value: process.env.CONTACT_TO ?? "nlognweb@gmail.com", group: "contact" },
];

/** Mirrors the categories the committed MDX posts already use. */
const CATEGORIES = ["SEO", "Web Development", "Performance", "Growth", "AI & Automation", "Design"];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "nlognweb@gmail.com").toLowerCase();
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");

  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing) {
    console.log(`✓ Admin ${email} already exists — left untouched.`);
  } else {
    await prisma.adminUser.create({
      data: {
        email,
        name: process.env.ADMIN_NAME ?? "nlogn",
        passwordHash: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
      },
    });
    console.log(`✓ Created super admin: ${email}`);
    if (generated) {
      console.log("");
      console.log("  ┌────────────────────────────────────────────────┐");
      console.log("  │  Generated password — shown once, copy it now  │");
      console.log("  └────────────────────────────────────────────────┘");
      console.log(`  ${password}`);
      console.log("");
    }
  }

  for (const setting of DEFAULT_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: setting.value as never, group: setting.group },
      update: {},
    });
  }
  console.log(`✓ Site settings ready (${DEFAULT_SETTINGS.length} keys)`);

  for (const name of CATEGORIES) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await prisma.category.upsert({ where: { slug }, create: { name, slug }, update: {} });
  }
  console.log(`✓ Categories ready (${CATEGORIES.length})`);

  console.log("\nSeed complete. Sign in at /admin/login");
}

main()
  .catch((error: unknown) => {
    // Driver failures arrive as an ErrorEvent whose default formatting says
    // nothing useful, so pull out whatever detail there is.
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "type" in error
          ? `${(error as { type: string }).type} — the driver could not reach the database`
          : String(error);

    console.error(`\n  Seed failed: ${detail}\n`);
    console.error("  If that looks like a connection problem, run:  npm run db:doctor");
    console.error("  It reports which transport this network allows, then set");
    console.error("  DATABASE_TRANSPORT=ws|http|tcp in .env.local to match.\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
