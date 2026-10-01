import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/page-hero";
import { Mdx } from "@/components/blog/mdx";
import { ArticleContent } from "@/components/blog/article-content";
import { TableOfContents } from "@/components/blog/toc";
import { PostCard } from "@/components/blog/post-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { EngagementProvider } from "@/components/engagement/provider";
import { ArticleEngagement } from "@/components/engagement/engagement-bar";
import { Comments } from "@/components/engagement/comments";
import { engagementKey, kindFromPost } from "@/lib/engagement";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getAllPosts, getRelatedPosts } from "@/lib/blog";
import { getMergedPost, getMergedPosts, resolveRedirect } from "@/server/public-content";
import { absoluteUrl, formatDate, slugify } from "@/lib/utils";
import { siteConfig } from "@/config/site";

type Params = { params: Promise<{ slug: string }> };

/**
 * Only the committed MDX files are prerendered. A CMS post is rendered on first
 * request and then cached, so publishing does not require a rebuild — and a
 * build does not require the database to be reachable.
 */
export const revalidate = 60;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getMergedPost(slug);
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
  const post = await getMergedPost(slug);
  if (!post) {
    // The slug may have been renamed after publication.
    const moved = await resolveRedirect(`/blog/${slug}`);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  // Static posts keep their existing relevance ranking; a CMS post falls back
  // to the newest few of the same kind, which is the best signal available.
  const related = post.source === "static"
    ? getRelatedPosts(post.slug)
    : (await getMergedPosts(post.kind ?? "post")).filter((p) => p.slug !== post.slug).slice(0, 3);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  const kind = kindFromPost(post.kind);
  // This article, plus every card in "Read next" — one request covers the page.
  const keys = [
    engagementKey(kind, post.slug),
    ...related.map((p) => engagementKey(kindFromPost(p.kind), p.slug)),
  ];

  return (
    <EngagementProvider keys={keys}>
      <article>
        <section className="page-hero">
          <div className="wrap">
            <div className="section-top">
              <Breadcrumbs items={crumbs.slice(0, 2)} />
              <Link className="eyebrow" href={`/blog/category/${slugify(post.category)}`}>
                {post.category} ↗
              </Link>
            </div>
            <h1 className="page-title is-long">{post.title}</h1>
            <div className="page-hero-foot">
              <div className="page-lead">
                <p>{post.description}</p>
              </div>
              <div className="article-meta">
                <span>
                  <b>Written by</b>
                  {post.author}
                </span>
                <span>
                  <b>Published</b>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span>
                  <b>Reading</b>
                  {post.readingMinutes} min
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section is-tight">
          <div className="wrap">
            {post.image && (
              <figure className="article-cover">
                <Image
                  src={post.image}
                  alt={post.imageAlt ?? post.title}
                  fill
                  priority
                  sizes="92vw"
                />
              </figure>
            )}

            <div className="article-layout">
              {/* min-w-0: without it the grid track sizes to the widest code
                  block's min-content and the article runs off a phone screen. */}
              <div className="site-theme min-w-0">
                {/* Also where the view is recorded — the beacon lives in the
                    component that shows the number. */}
                <ArticleEngagement kind={kind} slug={post.slug} className="mb-10" />

                {post.source === "cms" ? (
                  <ArticleContent html={post.contentHtml} />
                ) : (
                  <div className="article-content">
                    <Mdx source={post.content} />
                  </div>
                )}

                {post.tags.length > 0 && (
                  <ul className="mt-14 flex flex-wrap gap-2 border-t border-line pt-8">
                    {post.tags.map((tag) => (
                      <li key={tag}>
                        <Link className="chip" href={`/blog/tag/${slugify(tag)}`}>
                          #{tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-12 border-t border-ink pt-7">
                  <p className="eyebrow text-muted">Written by</p>
                  <p className="mt-3 font-display text-2xl text-ink">{post.author}</p>
                  <p className="mt-1 text-sm text-muted">{post.authorRole}</p>
                  <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
                    Part of the four-person team at {siteConfig.name}. We publish what we learn on
                    client work — the numbers included.
                  </p>
                </div>
              </div>

              <aside className="site-theme article-aside">
                <TableOfContents headings={post.headings} />
                <div className="mt-10 bg-[#dce4fc] p-6">
                  <p className="eyebrow">The Growth Brief</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    One essay a month, no pitch.
                  </p>
                  <div className="mt-5">
                    <NewsletterForm compact />
                  </div>
                </div>
                <Link className="text-link mt-8" href="/blog">
                  ← All posts
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </article>

      {related.length > 0 && (
        <section className="page-section is-ruled">
          <div className="wrap">
            <SectionHeading
              eyebrow="Read next"
              aside={
                <Link className="text-link" href="/blog">
                  All field notes ↗
                </Link>
              }
              title={
                <>
                  More from
                  <br />
                  <em>the notebook.</em>
                </>
              }
            />
            <ul className="cards">
              {related.map((p) => (
                <li key={p.slug} className="reveal">
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="page-section is-ruled">
        <div className="wrap">
          <div className="site-theme max-w-2xl">
            <Comments kind={kind} slug={post.slug} />
          </div>
        </div>
      </section>

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
            "@type": "BlogPosting",
            "@id": absoluteUrl(`/blog/${post.slug}#post`),
            headline: post.title,
            description: post.description,
            url: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            wordCount: (post.content || post.contentHtml || "").split(/\s+/).length,
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
    </EngagementProvider>
  );
}
