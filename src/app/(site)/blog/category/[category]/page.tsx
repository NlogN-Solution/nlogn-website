import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { PostGrid } from "@/components/blog/post-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getCategories } from "@/lib/blog";
import { getMergedAllPosts, getMergedCategories } from "@/server/public-content";
import { slugify } from "@/lib/utils";
import { absoluteUrl } from "@/lib/utils";
import { EngagementProvider } from "@/components/engagement/provider";
import { engagementKey, kindFromPost } from "@/lib/engagement";

type Params = { params: Promise<{ category: string }> };

/** Static categories prerender; a CMS-only category renders on demand. */
export const revalidate = 60;

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const match = getCategories().find((c) => c.slug === category);
  if (!match)
    return buildMetadata({ title: "Category not found", description: "", path: "/blog", noIndex: true });

  return buildMetadata({
    title: `${match.name} — articles from the nlogn team`,
    description: `${match.count} ${match.count === 1 ? "article" : "articles"} on ${match.name.toLowerCase()}, written from client work by the nlogn team.`,
    path: `/blog/category/${match.slug}`,
  });
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const all = await getMergedCategories();
  const match = all.find((c) => c.slug === category);
  if (!match) notFound();

  const posts = (await getMergedAllPosts()).filter((p) => slugify(p.category) === category);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: match.name, path: `/blog/category/${match.slug}` },
  ];

  return (
    <>
      <PageHero
        eyebrow="Category"
        title={match.name}
        lead={`${match.count} ${match.count === 1 ? "article" : "articles"} in this category.`}
        crumbs={crumbs}
        chips={
          <>
            <Link className="chip" href="/blog">
              All posts
            </Link>
            {all.map((c) => (
              <Link
                key={c.slug}
                className="chip"
                href={`/blog/category/${c.slug}`}
                aria-current={c.slug === match.slug ? "page" : undefined}
              >
                {c.name} <small>{c.count}</small>
              </Link>
            ))}
          </>
        }
      />

      <EngagementProvider keys={posts.map((p) => engagementKey(kindFromPost(p.kind), p.slug))}>
        <section className="page-section">
          <div className="wrap">
            <PostGrid posts={posts} />
          </div>
        </section>
      </EngagementProvider>

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: match.name,
            url: absoluteUrl(`/blog/category/${match.slug}`),
            isPartOf: { "@id": absoluteUrl("/blog#blog") },
          },
        ]}
        id="category-schema"
      />
    </>
  );
}
