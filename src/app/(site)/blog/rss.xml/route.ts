import { getMergedAllPosts } from "@/server/public-content";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/** Regenerated hourly rather than frozen at build, so CMS posts reach the feed. */
export const revalidate = 3600;

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );
}

export async function GET() {
  const posts = await getMergedAllPosts();
  const updated = posts[0]?.date ?? new Date().toISOString();

  const items = posts
    .map((post) =>
      [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${absoluteUrl(`/blog/${post.slug}`)}</link>`,
        `      <guid isPermaLink="true">${absoluteUrl(`/blog/${post.slug}`)}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(post.category)}</category>`,
        `      <dc:creator>${escapeXml(post.author)}</dc:creator>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Growth Brief — ${siteConfig.name}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escapeXml("Essays on web performance, technical SEO, Next.js and digital growth from the nlogn team.")}</description>
    <language>en</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/blog/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
