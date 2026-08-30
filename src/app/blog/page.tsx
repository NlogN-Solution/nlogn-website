import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/blog/post-card";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getAllPosts, getCategories, getFeaturedPost } from "@/lib/blog";
import { absoluteUrl } from "@/lib/utils";

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

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = getFeaturedPost();
  const rest = posts.filter((p) => p.slug !== featured?.slug);
  const categories = getCategories();

  return (
    <>
      <PageHero
        eyebrow="The Growth Brief"
        title={
          <>
            What we have learned, <span className="text-gradient-violet">written down</span>
          </>
        }
        lead="No listicles and no reheated best practices. Every post here comes out of work we did, including the parts that did not go to plan."
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-ink bg-ink px-4 py-2 text-sm font-medium text-white">
            All posts
          </span>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/blog/category/${c.slug}`}
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-soft transition-colors hover:border-violet/40 hover:text-violet"
            >
              {c.name}
              <span className="ml-2 text-muted">{c.count}</span>
            </Link>
          ))}
        </div>
      </PageHero>

      <div className="container-x py-16 md:py-24">
        {featured && (
          <Reveal>
            <div className="mb-5">
              <PostCard post={featured} featured />
            </div>
          </Reveal>
        )}

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <Reveal as="li" key={post.slug} delay={(i % 3) * 0.07} className="h-full">
              <PostCard post={post} />
            </Reveal>
          ))}
        </ul>

        <Reveal>
          <div className="mt-16 grid gap-8 rounded-[26px] border border-line bg-surface p-9 md:grid-cols-[1.3fr_1fr] md:items-center md:p-12">
            <div>
              <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
                One essay a month. No pitch.
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                The Growth Brief goes out to 2,400 founders and marketing leads. Unsubscribe
                in one click, and we never sell the list.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </Reveal>
      </div>

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
