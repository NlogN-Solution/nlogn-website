/**
 * Re-renders every stored article body from its saved editor document.
 *
 * `contentHtml` is written once, when a post is saved, so a change to
 * `server/content-render.ts` reaches new posts only — everything already
 * published keeps the markup the old renderer produced. This walks the tables
 * and writes each body back through the current renderer.
 *
 * Run it after any change to the renderer's output:
 *
 *   npm run content:rerender          # report what would change
 *   npm run content:rerender -- --write
 *
 * Reading and writing one row at a time is deliberate: this is a maintenance
 * task run by hand against a live database, and a batch that half-succeeds is
 * worse than one that is slow.
 */
import { loadEnv } from "../prisma/env";

// `tsx` does not read .env.local the way `next` does, and this has to happen
// before `server/db` is imported — that module reads DATABASE_URL as it
// initialises, which is why the imports below are dynamic.
loadEnv();

const write = process.argv.includes("--write");

type Row = { id: string; slug: string; content: unknown; contentHtml: string | null };
type Patch = { contentHtml: string; readingMinutes: number };

async function main() {
  const { prisma } = await import("@/server/db");
  const { renderEditorDoc, editorPlainText, readingMinutes } = await import(
    "@/server/content-render"
  );

  const rerender = async (
    label: string,
    rows: Row[],
    save: (id: string, data: Patch) => Promise<unknown>,
  ) => {
    let changed = 0;

    for (const row of rows) {
      if (!row.content) continue;

      const html = renderEditorDoc(row.content);
      if (html === row.contentHtml) continue;

      changed += 1;
      if (write) {
        await save(row.id, { contentHtml: html, readingMinutes: readingMinutes(row.content) });
        console.log(`  updated ${row.slug}`);
      } else {
        // Enough to see the change is the expected one without dumping a whole
        // article body into a terminal.
        const words = editorPlainText(row.content).split(/\s+/).filter(Boolean).length;
        console.log(`  would update ${row.slug} (${words} words)`);
      }
    }

    console.log(`${label}: ${changed} of ${rows.length} ${write ? "updated" : "would change"}\n`);
  };

  const select = { id: true, slug: true, content: true, contentHtml: true };

  try {
    const blogs = (await prisma.blog.findMany({ select })) as Row[];
    await rerender("Blogs", blogs, (id, data) => prisma.blog.update({ where: { id }, data }));

    const insights = (await prisma.insight.findMany({ select })) as Row[];
    await rerender("Insights", insights, (id, data) =>
      prisma.insight.update({ where: { id }, data }),
    );

    if (!write) console.log("Nothing was written. Re-run with --write to apply.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
