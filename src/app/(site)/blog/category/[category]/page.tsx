import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getCategories } from "@/lib/blog";
import { getMergedAllPosts, getMergedCategories } from "@/server/public-content";
import { slugify } from "@/lib/utils";
import { absoluteUrl } from "@/lib/utils";

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
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-soft transition-colors hover:border-violet/40 hover:text-violet"
          >
            All posts
          </Link>
          {all.map((c) => (
            <Link
              key={c.slug}
              href={`/blog/category/${c.slug}`}
              aria-current={c.slug === match.slug ? "page" : undefined}
              className={
                c.slug === match.slug
                  ? "rounded-full border border-ink bg-ink px-4 py-2 text-sm font-medium text-white"
                  : "rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-soft transition-colors hover:border-violet/40 hover:text-violet"
              }
            >
              {c.name}
            </Link>
          ))}
        </div>
      </PageHero>

      <div className="container-x py-16 md:py-24">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal as="li" key={post.slug} delay={(i % 3) * 0.07} className="h-full">
              <PostCard post={post} />
            </Reveal>
          ))}
        </ul>
      </div>

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
