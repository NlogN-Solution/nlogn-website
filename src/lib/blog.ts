import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { slugify } from "@/lib/utils";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

/** Insights are the strategic pieces; posts are the practical ones. */
export type PostKind = "insight" | "post";

export type PostFrontmatter = {
  kind?: PostKind;
  title: string;
  description: string;
  /** Card and article artwork, under /public. Cards fall back to a mark when absent. */
  image?: string;
  imageAlt?: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  featured?: boolean;
  keywords?: string[];
};

export type Post = PostFrontmatter & {
  slug: string;
  content: string;
  readingMinutes: number;
  headings: { id: string; text: string; level: number }[];
};

function extractHeadings(markdown: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  // Ignore anything inside fenced code blocks before matching headings.
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const re = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(withoutCode)) !== null) {
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({ id: slugify(text), text, level: match[1].length });
  }
  return headings;
}

function readPost(fileName: string): Post {
  const slug = fileName.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  return {
    ...fm,
    tags: fm.tags ?? [],
    slug,
    content,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    headings: extractHeadings(content),
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(readPost)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** Everything under one heading. Categories, tags and RSS stay across both. */
export function getPostsByKind(kind: PostKind): Post[] {
  return getAllPosts().filter((p) => (p.kind ?? "post") === kind);
}

/** The lead item for a listing — the flagged one, else the newest. */
export function getLead(posts: Post[]): Post | undefined {
  return posts.find((p) => p.featured) ?? posts[0];
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getFeaturedPost(): Post | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.featured) ?? posts[0];
}

export function getCategories() {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => b.count - a.count);
}

export function getTags() {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByCategory(categorySlug: string) {
  return getAllPosts().filter((p) => slugify(p.category) === categorySlug);
}

export function getPostsByTag(tagSlug: string) {
  return getAllPosts().filter((p) => p.tags.some((t) => slugify(t) === tagSlug));
}

/** Related posts: same category first, then shared tags, then recency. */
export function getRelatedPosts(slug: string, limit = 3) {
  const current = getPost(slug);
  if (!current) return [];
  return getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const sharedTags = p.tags.filter((t) => current.tags.includes(t)).length;
      const score = (p.category === current.category ? 3 : 0) + sharedTags;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score || +new Date(b.post.date) - +new Date(a.post.date))
    .slice(0, limit)
    .map((x) => x.post);
}
