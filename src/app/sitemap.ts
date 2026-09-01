import type { MetadataRoute } from "next";
import { softwareProducts } from "@/config/software";
import { getCategories, getTags } from "@/lib/blog";
import { getMergedAllPosts, getMergedWorks } from "@/server/public-content";
import { absoluteUrl } from "@/lib/utils";

/**
 * Both sources, one sitemap. If the database is unreachable the merge layer
 * falls back to the committed content, so the sitemap degrades rather than 500s.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await getMergedAllPosts();
  const caseStudies = await getMergedWorks();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/works"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/process"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    { url: absoluteUrl("/resources"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/insights"), lastModified: posts[0] ? new Date(posts[0].date) : now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/blog"), lastModified: posts[0] ? new Date(posts[0].date) : now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/case-studies"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/software"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticRoutes,
    ...caseStudies.map((w) => ({
      url: absoluteUrl(`/case-studies/${w.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...softwareProducts.map((p) => ({
      url: absoluteUrl(`/software/${p.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: new Date(p.updated ?? p.date),
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.8 : 0.6,
    })),
    ...getCategories().map((c) => ({
      url: absoluteUrl(`/blog/category/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...getTags().map((t) => ({
      url: absoluteUrl(`/blog/tag/${t.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
