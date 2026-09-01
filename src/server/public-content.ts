import { prisma, dbRead } from "@/server/db";
import { getAllPosts, getPost, type Post, type PostKind } from "@/lib/blog";
import { works, type Work } from "@/config/site";
import { cdnUrl } from "@/server/integrations/cloudinary";
import { slugify } from "@/lib/utils";

/**
 * Where the existing site and the CMS meet.
 *
 * The rule this file exists to enforce: **the committed MDX posts and the
 * hardcoded case studies keep working exactly as they do today.** They are read
 * from disk first and always win a slug collision, because their URLs are
 * already indexed. CMS records are adapted into the same `Post` / `Work` shapes
 * the existing components already take, so nothing downstream had to change to
 * display them.
 *
 * Every database read here is wrapped: if Postgres is unreachable, the public
 * site quietly falls back to the static content and stays up. A CMS outage must
 * never be a website outage.
 */

export type ContentSource = "static" | "cms";

/** A post from either source. `contentHtml` is set only for CMS records. */
export type UnifiedPost = Post & {
  source: ContentSource;
  contentHtml?: string;
  id?: string;
};

export type UnifiedWork = Work & {
  source: ContentSource;
  heroImage?: string;
  thumbnail?: string;
  gallery?: { url: string; alt?: string | null; caption?: string | null }[];
};

/**
 * Every database read on a public page goes through the shared breaker in
 * `server/db.ts`: it returns the fallback on failure, and once the database has
 * failed a few times in a row it stops trying for a while so each render is not
 * paying a connection timeout.
 */
function safely<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  return dbRead(fn, fallback, label);
}

/* ── articles ────────────────────────────────────────────────────────────── */

type CmsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentHtml: string | null;
  readingMinutes: number | null;
  featured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  authorName: string | null;
  authorRole: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { name: string } | null;
  tags: { name: string }[];
  coverMedia: { secureUrl: string; alt: string | null } | null;
  author: { name: string } | null;
};

/** Adapts a CMS row into the `Post` shape the existing cards and pages take. */
function toPost(row: CmsArticle, kind: PostKind): UnifiedPost {
  const headings = extractHeadings(row.contentHtml ?? "");

  return {
    kind,
    slug: row.slug,
    title: row.title,
    description: row.excerpt ?? row.seoDescription ?? "",
    image: row.coverMedia ? cdnUrl(row.coverMedia.secureUrl, "card") : undefined,
    imageAlt: row.coverMedia?.alt ?? undefined,
    date: (row.publishedAt ?? row.updatedAt).toISOString(),
    updated: row.updatedAt.toISOString(),
    category: row.category?.name ?? "General",
    tags: row.tags.map((t) => t.name),
    author: row.authorName ?? row.author?.name ?? "nlogn",
    authorRole: row.authorRole ?? "",
    featured: row.featured,
    content: "",
    contentHtml: row.contentHtml ?? "",
    readingMinutes: row.readingMinutes ?? 1,
    headings,
    source: "cms",
    id: row.id,
  };
}

/** Pulls the table of contents out of rendered HTML, matching the MDX behaviour. */
function extractHeadings(html: string) {
  const out: { id: string; text: string; level: number }[] = [];
  const re = /<h([23])>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (text) out.push({ id: slugify(text), text, level: Number(match[1]) });
  }
  return out;
}

const articleInclude = {
  category: { select: { name: true } },
  tags: { select: { name: true } },
  coverMedia: { select: { secureUrl: true, alt: true } },
  author: { select: { name: true } },
};

async function cmsArticles(kind: PostKind): Promise<UnifiedPost[]> {
  return safely(
    async () => {
      const now = new Date();
      const where = {
        status: "PUBLISHED" as const,
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      };
      const rows =
        kind === "insight"
          ? await prisma.insight.findMany({ where, include: articleInclude, orderBy: { publishedAt: "desc" } })
          : await prisma.blog.findMany({ where, include: articleInclude, orderBy: { publishedAt: "desc" } });
      return (rows as unknown as CmsArticle[]).map((row) => toPost(row, kind));
    },
    [],
    `${kind} list`,
  );
}

/**
 * Static posts first, then CMS posts, sorted by date. A CMS post whose slug
 * collides with a committed file is dropped rather than shadowing it — the file
 * is the one already in Google's index.
 */
export async function getMergedPosts(kind: PostKind): Promise<UnifiedPost[]> {
  const staticPosts: UnifiedPost[] = getAllPosts()
    .filter((p) => (p.kind ?? "post") === kind)
    .map((p) => ({ ...p, source: "static" as const }));

  const taken = new Set(staticPosts.map((p) => p.slug));
  const fromCms = (await cmsArticles(kind)).filter((p) => !taken.has(p.slug));

  return [...staticPosts, ...fromCms].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** Every post of both kinds, for RSS, sitemaps and tag pages. */
export async function getMergedAllPosts(): Promise<UnifiedPost[]> {
  const [posts, insights] = await Promise.all([getMergedPosts("post"), getMergedPosts("insight")]);
  return [...posts, ...insights].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getMergedPost(slug: string): Promise<UnifiedPost | undefined> {
  const fromDisk = getPost(slug);
  if (fromDisk) return { ...fromDisk, source: "static" };

  return safely(
    async () => {
      const now = new Date();
      const where = {
        slug,
        status: "PUBLISHED" as const,
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      };
      const blog = await prisma.blog.findFirst({ where, include: articleInclude });
      if (blog) return toPost(blog as unknown as CmsArticle, "post");
      const insight = await prisma.insight.findFirst({ where, include: articleInclude });
      if (insight) return toPost(insight as unknown as CmsArticle, "insight");
      return undefined;
    },
    undefined,
    `post ${slug}`,
  );
}

/* ── case studies ────────────────────────────────────────────────────────── */

type CmsCase = {
  slug: string;
  projectName: string;
  clientName: string;
  industry: string | null;
  projectType: string | null;
  summary: string | null;
  shortDescription: string | null;
  challenge: string | null;
  approach: unknown;
  outcome: string | null;
  metrics: unknown;
  technologies: string[];
  servicesUsed: string[];
  timeline: string | null;
  year: string | null;
  accent: string | null;
  testimonialQuote: string | null;
  testimonialName: string | null;
  testimonialRole: string | null;
  heroMedia: { secureUrl: string; alt: string | null } | null;
  thumbnail: { secureUrl: string; alt: string | null } | null;
  gallery: { secureUrl: string; alt: string | null; caption: string | null }[];
};

/** Adapts a CMS case study into the `Work` shape the existing template takes. */
function toWork(row: CmsCase): UnifiedWork {
  const approach = Array.isArray(row.approach) ? (row.approach as string[]) : [];
  const metrics = Array.isArray(row.metrics)
    ? (row.metrics as { value: string; label: string }[])
    : [];

  return {
    slug: row.slug,
    client: row.clientName,
    title: row.projectName,
    category: row.industry ?? row.projectType ?? "Project",
    year: row.year ?? String(new Date().getFullYear()),
    summary: row.summary ?? row.shortDescription ?? "",
    challenge: row.challenge ?? "",
    approach,
    outcome: row.outcome ?? "",
    metrics,
    services: row.servicesUsed,
    stack: row.technologies,
    duration: row.timeline ?? "",
    accent: row.accent ?? "#6c47ff",
    testimonial: row.testimonialQuote
      ? {
          quote: row.testimonialQuote,
          name: row.testimonialName ?? "",
          role: row.testimonialRole ?? "",
        }
      : undefined,
    source: "cms",
    heroImage: row.heroMedia ? cdnUrl(row.heroMedia.secureUrl, "hero") : undefined,
    thumbnail: row.thumbnail ? cdnUrl(row.thumbnail.secureUrl, "card") : undefined,
    gallery: row.gallery.map((g) => ({
      url: cdnUrl(g.secureUrl, "full"),
      alt: g.alt,
      caption: g.caption,
    })),
  };
}

const caseInclude = {
  heroMedia: { select: { secureUrl: true, alt: true } },
  thumbnail: { select: { secureUrl: true, alt: true } },
  gallery: { select: { secureUrl: true, alt: true, caption: true } },
};

export async function getMergedWorks(): Promise<UnifiedWork[]> {
  const staticWorks: UnifiedWork[] = works.map((w) => ({ ...w, source: "static" as const }));
  const taken = new Set(staticWorks.map((w) => w.slug));

  const fromCms = await safely(
    async () => {
      const rows = await prisma.caseStudy.findMany({
        where: { status: "PUBLISHED" },
        include: caseInclude,
        orderBy: { publishedAt: "desc" },
      });
      return (rows as unknown as CmsCase[]).map(toWork);
    },
    [] as UnifiedWork[],
    "case study list",
  );

  return [...staticWorks, ...fromCms.filter((w) => !taken.has(w.slug))];
}

export async function getMergedWork(slug: string): Promise<UnifiedWork | undefined> {
  const fromConfig = works.find((w) => w.slug === slug);
  if (fromConfig) return { ...fromConfig, source: "static" };

  return safely(
    async () => {
      const row = await prisma.caseStudy.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: caseInclude,
      });
      return row ? toWork(row as unknown as CmsCase) : undefined;
    },
    undefined,
    `case study ${slug}`,
  );
}

/* ── taxonomy across both sources ────────────────────────────────────────── */

export async function getMergedCategories() {
  const posts = await getMergedAllPosts();
  const counts = new Map<string, number>();
  for (const post of posts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => b.count - a.count);
}

export async function getMergedTags() {
  const posts = await getMergedAllPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => b.count - a.count);
}

/* ── redirects ───────────────────────────────────────────────────────────── */

/**
 * A slug that used to be live.
 *
 * Renaming a published item records the old path, and the detail pages call
 * this before giving up with a 404 — so an indexed URL keeps working instead of
 * quietly becoming a dead link. Resolved here rather than in middleware because
 * middleware runs on the Edge, where the database client cannot go.
 */
export async function resolveRedirect(fromPath: string) {
  return safely(
    async () => {
      const hit = await prisma.redirect.findUnique({ where: { fromPath } });
      return hit?.toPath;
    },
    undefined,
    `redirect ${fromPath}`,
  );
}
