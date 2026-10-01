import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { PostGrid } from "@/components/blog/post-grid";
import { SignupBand } from "@/components/site/signup-band";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getLead } from "@/lib/blog";
import { getMergedCategories, getMergedPosts } from "@/server/public-content";
import { absoluteUrl } from "@/lib/utils";
import { EngagementProvider } from "@/components/engagement/provider";
import { engagementKey, kindFromPost } from "@/lib/engagement";

export const metadata: Metadata = buildMetadata({
  title: "The Growth Brief — essays on web performance, SEO and growth",
  description:
    "Field notes from real engagements: Core Web Vitals, technical SEO, Next.js performance, content strategy and the numbers behind each one. Written by the people doing the work.",
  path: "/blog",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
];

/**
 * Revalidated rather than fully dynamic: the committed MDX posts still render
 * from a static build, and anything published in the CMS appears within the
 * minute without giving up prerendered delivery.
 */
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getMergedPosts("post");
  const featured = getLead(posts);
  const categories = await getMergedCategories();

  return (
    <>
      <PageHero
        eyebrow="The Growth Brief"
        title={
          <>
            What we have learned, <em>written down.</em>
          </>
        }
        lead="No listicles and no reheated best practices. Every post here comes out of work we did, including the parts that did not go to plan."
        crumbs={crumbs}
        chips={
          <>
            <span className="chip" aria-current="page">
              All posts <small>{posts.length}</small>
            </span>
            {categories.map((c) => (
              <Link key={c.slug} className="chip" href={`/blog/category/${c.slug}`}>
                {c.name} <small>{c.count}</small>
              </Link>
            ))}
          </>
        }
      />

      <EngagementProvider keys={posts.map((p) => engagementKey(kindFromPost(p.kind), p.slug))}>
        <section className="page-section">
          <div className="wrap">
            <PostGrid posts={posts} lead={featured} />
            <SignupBand />
          </div>
        </section>
      </EngagementProvider>
      <CtaBand
        title={
          <>
            Want this done <em>to your site?</em>
          </>
        }
      />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "Blog",
            "@id": absoluteUrl("/blog#blog"),
            name: "The Growth Brief",
            url: absoluteUrl("/blog"),
            description:
              "Essays on web performance, technical SEO, Next.js and digital growth from the nlogn team.",
            publisher: { "@id": absoluteUrl("/#organization") },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.date,
              author: { "@type": "Person", name: p.author },
            })),
          },
        ]}
        id="blog-schema"
      />
    </>
  );
}
