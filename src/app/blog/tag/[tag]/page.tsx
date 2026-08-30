import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getPostsByTag, getTags } from "@/lib/blog";
import { absoluteUrl } from "@/lib/utils";

type Params = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return getTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  const match = getTags().find((t) => t.slug === tag);
  if (!match)
    return buildMetadata({ title: "Tag not found", description: "", path: "/blog", noIndex: true });

  return buildMetadata({
    title: `${match.name} — tagged articles`,
    description: `Every nlogn article tagged ${match.name}. ${match.count} ${match.count === 1 ? "post" : "posts"}.`,
    path: `/blog/tag/${match.slug}`,
  });
}

export default async function TagPage({ params }: Params) {
  const { tag } = await params;
  const match = getTags().find((t) => t.slug === tag);
  if (!match) notFound();

  const posts = getPostsByTag(tag);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: `#${match.name}`, path: `/blog/tag/${match.slug}` },
  ];

  return (
    <>
      <PageHero
        eyebrow="Tag"
        title={`#${match.name}`}
        lead={`${match.count} ${match.count === 1 ? "article" : "articles"} tagged ${match.name}.`}
        crumbs={crumbs}
      />

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
            name: `#${match.name}`,
            url: absoluteUrl(`/blog/tag/${match.slug}`),
            isPartOf: { "@id": absoluteUrl("/blog#blog") },
          },
        ]}
        id="tag-schema"
      />
    </>
  );
}
