import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArticleContent } from "@/components/blog/article-content";
import { JsonLd } from "@/components/seo/json-ld";
import { EngagementProvider } from "@/components/engagement/provider";
import { ArticleEngagement } from "@/components/engagement/engagement-bar";
import { Comments } from "@/components/engagement/comments";
import { engagementKey } from "@/lib/engagement";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { works } from "@/config/site";
import { getMergedWork, getMergedWorks, resolveRedirect } from "@/server/public-content";
import { absoluteUrl, slugify } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

/**
 * The hardcoded case studies prerender at build time; a CMS one renders on
 * first request and is then cached, so publishing needs no rebuild.
 */
export const revalidate = 60;

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const work = await getMergedWork(slug);
  if (!work)
    return buildMetadata({ title: "Case study not found", description: "", path: "/case-studies", noIndex: true });

  return buildMetadata({
    title: `${work.client} case study — ${work.title}`,
    description: work.summary,
    path: `/case-studies/${work.slug}`,
    type: "article",
  });
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  const work = await getMergedWork(slug);
  if (!work) {
    const moved = await resolveRedirect(`/case-studies/${slug}`);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  const all = await getMergedWorks();
  const index = all.findIndex((w) => w.slug === work.slug);
  const next = all[(index + 1) % all.length] ?? work;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Case studies", path: "/case-studies" },
    { name: work.client, path: `/case-studies/${work.slug}` },
  ];

  // This case study, plus the "next case study" card in the sidebar.
  const keys = [engagementKey("CASE_STUDY", work.slug), engagementKey("CASE_STUDY", next.slug)];

  return (
    <EngagementProvider keys={keys}>
      <article>
        <section className="page-hero">
          <div className="wrap">
            <div className="section-top">
              <Breadcrumbs items={crumbs} />
              <p className="eyebrow">
                {work.category} / {work.year}
              </p>
            </div>
            <h1 className="page-title is-long">
              <em>{work.client}.</em> {work.title}
            </h1>
            <div className="page-hero-foot">
              <div className="page-lead">
                <p>{work.summary}</p>
              </div>
              <div className="article-meta">
                <span>
                  <b>Engagement</b>
                  {work.duration}
                </span>
                <span>
                  <b>Year</b>
                  {work.year}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section is-tight" aria-label="Results">
          <div className="wrap">
            {work.heroImage && (
              <figure className="article-cover">
                <Image
                  src={work.heroImage}
                  alt={`${work.client} — ${work.title}`}
                  fill
                  priority
                  sizes="92vw"
                />
              </figure>
            )}
            <dl className="stat-row reveal">
              {work.metrics.map((m) => (
                <div key={m.label}>
                  <dd>{m.value}</dd>
                  <dt>{m.label}</dt>
                </div>
              ))}
            </dl>
            <div className="site-theme" style={{ marginTop: 40 }}>
              <ArticleEngagement kind="CASE_STUDY" slug={work.slug} />
            </div>
          </div>
        </section>

        <section className="page-section is-ruled">
          <div className="wrap">
            <div className="article-layout">
              <div className="story">
                {work.clientObjective && (
                  <div className="reveal">
                    <p className="eyebrow">What they came for</p>
                    <p className="story-lede">{work.clientObjective}</p>
                  </div>
                )}

                <div className="reveal">
                  <p className="eyebrow">The problem</p>
                  <p className="story-lede">{work.challenge}</p>
                </div>

                <div>
                  <p className="eyebrow">What we did</p>
                  <div className="steps">
                    {work.approach.map((step, i) => (
                      <article key={step}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <p style={{ marginTop: 0 }}>{step}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="reveal">
                  <p className="eyebrow">The result</p>
                  <p className="story-lede">{work.outcome}</p>
                </div>

                {work.contentHtml && (
                  <div className="site-theme border-t border-line pt-12">
                    <ArticleContent html={work.contentHtml} />
                  </div>
                )}

                {work.testimonial && (
                  <figure className="story-quote reveal">
                    <blockquote>“{work.testimonial.quote}”</blockquote>
                    <figcaption>
                      <b>{work.testimonial.name}</b> — {work.testimonial.role}
                    </figcaption>
                  </figure>
                )}
              </div>

              <aside className="article-aside">
                <ul className="rows">
                  <li>
                    <span className="eyebrow">Services</span>
                    <span>{work.services.join(", ")}</span>
                  </li>
                  <li>
                    <span className="eyebrow">Stack</span>
                    <span>{work.stack.join(", ")}</span>
                  </li>
                  <li>
                    <span className="eyebrow">Engagement</span>
                    <span>{work.duration}</span>
                  </li>
                </ul>
                <Link className="panel next-panel" href={`/case-studies/${next.slug}`}>
                  <span className="eyebrow">Next case study</span>
                  <h3>{next.client}</h3>
                  <span className="panel-foot">Read it ↗</span>
                </Link>
                <Link className="text-link" href="/case-studies" style={{ marginTop: 30 }}>
                  ← All case studies
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </article>

      {work.gallery && work.gallery.length > 0 && (
        <section className="page-section is-grey" aria-label="Gallery">
          <div className="wrap">
            <SectionHeading
              eyebrow="The work"
              title={
                <>
                  How it <em>looks.</em>
                </>
              }
            />
            <ul className="cards" style={{ "--cols": 2 } as React.CSSProperties}>
              {work.gallery.map((shot, i) => (
                <li key={shot.url} className="reveal">
                  <figure className="card">
                    <span className="card-media">
                      <Image
                        src={shot.url}
                        alt={shot.alt ?? `${work.client} — image ${i + 1}`}
                        fill
                        loading="lazy"
                        sizes="(max-width: 700px) 92vw, 46vw"
                      />
                    </span>
                    {shot.caption && <figcaption className="photo-note">{shot.caption}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="page-section is-ruled">
        <div className="wrap">
          <div className="site-theme max-w-2xl">
            <Comments kind="CASE_STUDY" slug={work.slug} />
          </div>
        </div>
      </section>

      <CtaBand />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "Article",
            headline: `${work.client}: ${work.title}`,
            description: work.summary,
            url: absoluteUrl(`/case-studies/${work.slug}`),
            author: { "@id": absoluteUrl("/#organization") },
            publisher: { "@id": absoluteUrl("/#organization") },
            datePublished: `${work.year}-01-01`,
            about: work.services.map((s) => ({ "@type": "Thing", name: s })),
            keywords: [...work.services, work.category, work.client].map(slugify).join(", "),
          },
        ]}
        id="work-schema"
      />
    </EngagementProvider>
  );
}
