import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/site/page-hero";
import { Mdx } from "@/components/blog/mdx";
import { TableOfContents } from "@/components/blog/toc";
import { PostCard } from "@/components/blog/post-card";
import { Reveal } from "@/components/ui/reveal";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
import { absoluteUrl, formatDate, slugify } from "@/lib/utils";
import { siteConfig } from "@/config/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post)
    return buildMetadata({ title: "Post not found", description: "", path: "/blog", noIndex: true });

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    authors: [post.author],
    tags: post.tags,
  });
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <>
      <article>
        <header className="relative overflow-hidden border-b border-line pb-14 pt-32 md:pb-16 md:pt-44">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_80%_0%,#ffffff_0%,transparent_60%)]" />
          <div className="container-x">
            <Breadcrumbs items={crumbs.slice(0, 2)} />

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link
                href={`/blog/category/${slugify(post.category)}`}
                className="label rounded-full bg-violet-wash px-3.5 py-2 text-violet-deep transition-colors hover:bg-violet hover:text-white"
              >
                {post.category}
              </Link>
              <span className="text-sm text-muted">{post.readingMinutes} min read</span>
            </div>

            <h1 className="mt-8 max-w-4xl text-[clamp(2.1rem,1.4rem+2.8vw,3.5rem)] font-extrabold leading-[1.07] tracking-[-0.04em] text-ink">
              {post.title}
            </h1>
            <p className="mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-muted md:text-lg">
              {post.description}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-line pt-7">
              <span className="grid size-11 place-items-center rounded-full bg-ink font-display text-xs font-bold text-white">
                {post.author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <span className="text-sm">
                <span className="block font-semibold text-ink">{post.author}</span>
                <span className="block text-muted">{post.authorRole}</span>
              </span>
              <span className="ml-auto text-sm text-muted">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated && post.updated !== post.date && (
                  <> · updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></>
                )}
              </span>
            </div>
          </div>
        </header>

        {post.image && (
          <div className="container-x -mt-8 md:-mt-10">
            <figure className="relative aspect-[16/9] overflow-hidden rounded-[26px] border border-line bg-canvas-2 md:aspect-[21/9]">
              <Image
                src={post.image}
                alt={post.imageAlt ?? post.title}
                fill
                priority
                sizes="(max-width: 1280px) 92vw, 75rem"
                className="object-cover"
              />
            </figure>
          </div>
        )}

        <div className="container-x py-14 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-16">
            <div className="max-w-2xl">
              <div className="prose-nlogn">
                <Mdx source={post.content} />
              </div>

              {post.tags.length > 0 && (
                <ul className="mt-14 flex flex-wrap gap-2 border-t border-line pt-8">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/blog/tag/${slugify(tag)}`}
                        className="inline-block rounded-full border border-line px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-violet/40 hover:text-violet"
                      >
                        #{tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-12 rounded-[24px] border border-line bg-surface p-8">
                <p className="label text-muted">Written by</p>
                <p className="mt-3 font-display text-lg font-bold text-ink">{post.author}</p>
                <p className="mt-1 text-sm text-violet-deep">{post.authorRole}</p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                  Part of the four-person team at {siteConfig.name}. We publish what we
                  learn on client work — the numbers included.
                </p>
              </div>
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <TableOfContents headings={post.headings} />
              <div className="mt-10 rounded-[22px] border border-line bg-surface p-6">
                <p className="label text-muted">The Growth Brief</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  One essay a month, no pitch.
                </p>
                <div className="mt-4">
                  <NewsletterForm compact />
                </div>
              </div>
              <Link
                href="/blog"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden />
                All posts
              </Link>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface py-16 md:py-24">
          <div className="container-x">
            <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
              Read next
            </h2>
            <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.slug} delay={i * 0.07} className="h-full">
                  <PostCard post={p} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand title="Want this done to your site?" />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "BlogPosting",
            "@id": absoluteUrl(`/blog/${post.slug}#post`),
            headline: post.title,
            description: post.description,
            url: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            wordCount: post.content.split(/\s+/).length,
            timeRequired: `PT${post.readingMinutes}M`,
            articleSection: post.category,
            ...(post.image ? { image: [absoluteUrl(post.image)] } : {}),
            keywords: (post.keywords ?? post.tags).join(", "),
            inLanguage: "en",
            author: {
              "@type": "Person",
              name: post.author,
              jobTitle: post.authorRole,
              worksFor: { "@id": absoluteUrl("/#organization") },
            },
            publisher: { "@id": absoluteUrl("/#organization") },
            isPartOf: { "@id": absoluteUrl("/blog#blog") },
            mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${post.slug}`) },
          },
        ]}
        id="post-schema"
      />
    </>
  );
}
