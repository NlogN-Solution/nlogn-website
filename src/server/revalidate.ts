import { revalidatePath } from "next/cache";
import type { ArticleKind } from "@/server/services/article.service";

/**
 * Publishing from the admin has to reach the public site now, not eventually.
 *
 * Every public page reads through `server/public-content.ts` and is cached by
 * ISR — `/blog/[slug]` holds a rendered page for `revalidate = 60`, and the
 * host serves it stale for a few minutes beyond that while it re-renders in the
 * background. That is right for traffic and wrong for publishing: a slug
 * visited *before* its post existed has a cached **404**, and every later
 * visitor keeps getting that 404 until some request happens to trigger the
 * background re-render. The post is live in the database the whole time.
 *
 * So each write marks the paths it can affect. In a Route Handler
 * `revalidatePath` does not re-render anything; it drops the cache entry so the
 * next visit renders fresh. That makes publishing feel immediate without giving
 * up the cache that keeps the site fast between edits.
 */

/** Detail pages for both kinds are served by `/blog/[slug]` — insights have no route of their own. */
const detailPath = (slug: string) => `/blog/${slug}`;

/**
 * Marks everything an article appears on. `slugs` takes the old slug as well as
 * the new one, because a rename leaves the previous URL cached and pointing at
 * a post that no longer answers there.
 */
export function revalidateArticle(kind: ArticleKind, ...slugs: (string | null | undefined)[]) {
  const paths = [
    ...new Set(slugs.filter((s): s is string => Boolean(s)).map(detailPath)),
    kind === "blog" ? "/blog" : "/insights",
    "/blog/rss.xml",
    "/sitemap.xml",
  ];

  safely(() => {
    for (const path of paths) revalidatePath(path);
    // Category and tag pages are dynamic, so they are marked by pattern: the
    // post's own terms are not enough, since an edit can remove a term too.
    revalidatePath("/blog/category/[category]", "page");
    revalidatePath("/blog/tag/[tag]", "page");
  });
}

/** The public surfaces a case study appears on. */
export function revalidateCaseStudy(...slugs: (string | null | undefined)[]) {
  const paths = [
    ...new Set(slugs.filter((s): s is string => Boolean(s)).map((s) => `/case-studies/${s}`)),
    "/case-studies",
    "/sitemap.xml",
  ];

  safely(() => {
    for (const path of paths) revalidatePath(path);
  });
}

/**
 * The write has already been committed by the time this runs, so a cache error
 * must not turn a successful save into a failed request. Worst case the content
 * appears when the normal ISR window rolls over, which is the old behaviour.
 */
function safely(run: () => void) {
  try {
    run();
  } catch (error) {
    console.error("[revalidate] failed:", error instanceof Error ? error.message : error);
  }
}
