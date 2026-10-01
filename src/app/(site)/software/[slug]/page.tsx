import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { StatusPill } from "@/components/home/software-card";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { softwareProducts, getProduct, STATUS_LABEL } from "@/config/software";
import { absoluteUrl } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return softwareProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product)
    return buildMetadata({
      title: "Product not found",
      description: "",
      path: "/software",
      noIndex: true,
    });

  return buildMetadata({
    title: `${product.name} — ${product.tagline}`,
    description: product.summary,
    path: `/software/${product.slug}`,
    type: "article",
  });
}

export default async function SoftwarePage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const index = softwareProducts.findIndex((p) => p.slug === product.slug);
  const next = softwareProducts[(index + 1) % softwareProducts.length];
  const unreleased = product.status !== "live";

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Software", path: "/software" },
    { name: product.name, path: `/software/${product.slug}` },
  ];

  return (
    <>
      <article>
        <section className="page-hero">
          <div className="wrap">
            <div className="section-top">
              <Breadcrumbs items={crumbs} />
              <p className="eyebrow">{product.sector}</p>
            </div>
            <h1 className="page-title">
              {product.name}. <em>{product.tagline}</em>
            </h1>
            <div className="page-hero-foot">
              <div className="page-lead">
                {product.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="page-hero-actions">
                {product.projectUrl ? (
                  <Button href={product.projectUrl} arrow>
                    Visit {product.name}
                  </Button>
                ) : null}
                <Button href="/contact" variant={product.projectUrl ? "secondary" : "primary"} arrow>
                  {unreleased ? "Ask about early access" : "Talk to us about it"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* the shot, or a poster where there is no interface to show yet */}
        <section className="page-section is-tight" aria-label={`${product.name} interface`}>
          <div className="wrap">
            {product.thumbnail ? (
              <figure className="article-cover is-shot reveal">
                <Image
                  src={product.thumbnail}
                  alt={`${product.name} — ${product.tagline}`}
                  fill
                  priority
                  sizes="92vw"
                />
              </figure>
            ) : (
              <figure
                className="article-cover is-poster reveal"
                style={{ "--card-bg": product.accent } as React.CSSProperties}
              >
                <strong aria-hidden="true">{product.name}</strong>
                <figcaption>
                  {product.name} is still being built, so there is no interface to show yet. What
                  follows is the product as it is being designed — not a finished screenshot
                  dressed up as one.
                </figcaption>
              </figure>
            )}

            {product.screenshots?.map((shot) => (
              <figure key={shot.src} className="reveal" style={{ marginTop: 40 }}>
                <div className="article-cover is-shot" style={{ marginBottom: 0 }}>
                  <Image src={shot.src} alt={shot.caption} fill sizes="92vw" />
                </div>
                <figcaption className="photo-note">{shot.caption}</figcaption>
              </figure>
            ))}

            <dl className="stat-row is-compact reveal" style={{ marginTop: 60 }}>
              {product.highlights.map((item) => (
                <div key={item.label}>
                  <dd>{item.value}</dd>
                  <dt>{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="page-section is-ruled">
          <div className="wrap">
            <div className="article-layout">
              <div className="story">
                <div className="reveal">
                  <p className="eyebrow">The problem</p>
                  <p className="story-lede">{product.problem.body}</p>
                  <ul className="ticks two-col" style={{ marginTop: 28 }}>
                    {product.problem.pains.map((pain) => (
                      <li key={pain}>{pain}</li>
                    ))}
                  </ul>
                </div>

                <div className="reveal">
                  <p className="eyebrow">The vision</p>
                  <h2 className="story-title">{product.vision.headline}</h2>
                  <div className="copy" style={{ marginTop: 24 }}>
                    {product.vision.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="eyebrow">What it does</p>
                  <div className="steps">
                    {product.modules.map((module, i) => (
                      <article key={module.title}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{module.title}</h3>
                          <p>{module.body}</p>
                          {module.bullets && (
                            <ul className="ticks" style={{ marginTop: 18 }}>
                              {module.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {product.architecture && (
                  <div>
                    <p className="eyebrow">How it is put together</p>
                    <ul className="panels" style={{ "--cols": 1, marginTop: 24 } as React.CSSProperties}>
                      {product.architecture.map((layer) => (
                        <li key={layer.layer} className="panel reveal" style={{ minHeight: 0 }}>
                          <span className="eyebrow">{layer.layer} layer</span>
                          <p>{layer.body}</p>
                          <div className="chips">
                            {layer.items.map((item) => (
                              <span key={item} className="tag">
                                {item}
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.roadmap && (
                  <div>
                    <p className="eyebrow">Where it is up to</p>
                    <p className="story-lede">
                      {product.name} is {STATUS_LABEL[product.status].toLowerCase()}. This is what
                      is built and what is next — kept current rather than aspirational.
                    </p>
                    <div className="steps roadmap">
                      {product.roadmap.map((stage) => (
                        <article key={stage.stage} className={stage.done ? "is-done" : undefined}>
                          <span>{stage.done ? "✓" : "→"}</span>
                          <div>
                            <h3>
                              {stage.stage} <small>{stage.done ? "Built" : "Next"}</small>
                            </h3>
                            <p>{stage.detail}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <p className="story-closing reveal">{product.closing}</p>
              </div>

              <aside className="article-aside">
                <ul className="rows">
                  <li>
                    <span className="eyebrow">Status</span>
                    <span>
                      <StatusPill status={product.status} />
                    </span>
                  </li>
                  <li>
                    <span className="eyebrow">Built for</span>
                    <span>{product.audience.join(", ")}</span>
                  </li>
                  <li>
                    <span className="eyebrow">Stack</span>
                    <span>{product.stack.join(", ")}</span>
                  </li>
                  {product.projectUrl && (
                    <li>
                      <span className="eyebrow">Live at</span>
                      <a href={product.projectUrl} target="_blank" rel="noopener noreferrer">
                        {product.projectUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                      </a>
                    </li>
                  )}
                </ul>
                <Link className="panel next-panel" href={`/software/${next.slug}`}>
                  <span className="eyebrow">Next product</span>
                  <h3>{next.name}</h3>
                  <span className="panel-foot">Read the write-up ↗</span>
                </Link>
                <Link className="text-link" href="/software" style={{ marginTop: 30 }}>
                  ← All software
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </article>

      <CtaBand
        title={
          unreleased ? (
            <>
              Want <em>early access?</em>
            </>
          ) : (
            <>
              Need something <em>like this?</em>
            </>
          )
        }
        lead={
          unreleased
            ? `${product.name} is not released yet. Tell us how your team works today and we will put you in front of it as soon as there is something worth showing.`
            : `We build platforms like ${product.name} for businesses that have outgrown spreadsheets. Tell us what your operation looks like and we will tell you honestly whether software is the answer.`
        }
      />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "SoftwareApplication",
            name: product.name,
            applicationCategory: "BusinessApplication",
            description: product.summary,
            url: absoluteUrl(`/software/${product.slug}`),
            author: { "@id": absoluteUrl("/#organization") },
            publisher: { "@id": absoluteUrl("/#organization") },
            operatingSystem: "Web",
            audience: { "@type": "Audience", audienceType: product.audience.join(", ") },
            ...(product.projectUrl ? { sameAs: product.projectUrl } : {}),
          },
        ]}
        id="software-schema"
      />
    </>
  );
}
