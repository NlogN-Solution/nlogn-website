import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Dot } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
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

/** A heading used at every top-level break in the write-up. */
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
      {children}
    </h2>
  );
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
        <header className="relative overflow-hidden border-b border-line pb-14 pt-32 md:pb-16 md:pt-44">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(80% 60% at 80% 0%, ${product.accent}1f 0%, transparent 60%)`,
            }}
          />
          <div className="container-x">
            <Breadcrumbs items={crumbs} />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <StatusPill status={product.status} />
              <span className="label rounded-full border border-line bg-surface px-3.5 py-2 text-ink-soft">
                {product.sector}
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-[clamp(2.2rem,1.4rem+3.2vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
              {product.name}
            </h1>
            <p className="mt-4 max-w-3xl font-display text-[clamp(1.15rem,1rem+0.7vw,1.6rem)] font-semibold tracking-[-0.02em] text-violet-deep">
              {product.tagline}
            </p>

            <div className="mt-8 max-w-2xl space-y-5">
              {product.intro.map((paragraph) => (
                <p key={paragraph} className="text-[1.0625rem] leading-relaxed text-muted md:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {product.projectUrl ? (
                <Button href={product.projectUrl} variant="primary" arrow>
                  Visit {product.name}
                </Button>
              ) : null}
              <Button
                href="/contact"
                variant={product.projectUrl ? "secondary" : "primary"}
                arrow
              >
                {unreleased ? "Ask about early access" : "Talk to us about it"}
              </Button>
            </div>
          </div>
        </header>

        {/* the shot, or a poster where there is no interface to show yet */}
        <section className="container-x pt-14 md:pt-20" aria-label={`${product.name} interface`}>
          <Reveal>
            <figure className="overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft">
              <div className="flex items-center gap-2 border-b border-line bg-canvas px-5 py-3.5">
                <span aria-hidden className="size-2.5 rounded-full bg-line" />
                <span aria-hidden className="size-2.5 rounded-full bg-line" />
                <span aria-hidden className="size-2.5 rounded-full bg-line" />
                <span className="ml-3 truncate rounded-full bg-surface px-3 py-1 font-mono text-[0.6875rem] text-muted">
                  {product.name.toLowerCase()}
                </span>
              </div>

              {product.thumbnail ? (
                <div className="relative aspect-[2/1] bg-canvas-2">
                  <Image
                    src={product.thumbnail}
                    alt={`${product.name} — ${product.tagline}`}
                    fill
                    priority
                    sizes="(max-width: 1280px) 96vw, 76rem"
                    className="object-cover object-top"
                  />
                </div>
              ) : (
                <div className="flex aspect-[2/1] flex-col items-center justify-center gap-6 bg-canvas-2 px-8 text-center">
                  <span
                    className="grid size-16 place-items-center rounded-2xl font-display text-xl font-extrabold tracking-[-0.04em] text-white shadow-lift"
                    style={{ backgroundColor: product.accent }}
                    aria-hidden
                  >
                    {product.monogram}
                  </span>
                  <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted">
                    {product.name} is still being built, so there is no interface to show yet.
                    What follows is the product as it is being designed — not a finished
                    screenshot dressed up as one.
                  </p>
                </div>
              )}
            </figure>
          </Reveal>

          {product.screenshots?.map((shot) => (
            <Reveal key={shot.src} delay={0.05}>
              <figure className="mt-6 overflow-hidden rounded-[26px] border border-line bg-surface">
                <div className="relative aspect-[2/1] bg-canvas-2">
                  <Image
                    src={shot.src}
                    alt={shot.caption}
                    fill
                    sizes="(max-width: 1280px) 96vw, 76rem"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="border-t border-line px-6 py-4 text-sm text-muted">
                  {shot.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </section>

        <section className="mt-14 border-y border-line bg-surface md:mt-20" aria-label="Highlights">
          <div className="container-x">
            <dl className="grid divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
              {product.highlights.map((item, i) => (
                <Reveal
                  key={item.label}
                  delay={i * 0.07}
                  className="py-8 md:px-8 md:first:pl-0 md:last:pr-0"
                >
                  <dt className="label text-muted">{item.label}</dt>
                  <dd className="mt-3 font-display text-[1.0625rem] font-bold leading-snug tracking-[-0.02em] text-ink">
                    {item.value}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <div className="container-x py-16 md:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
            <div className="max-w-2xl">
              <Reveal>
                <H2>The problem</H2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">
                  {product.problem.body}
                </p>
                <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {product.problem.pains.map((pain) => (
                    <li key={pain} className="flex items-start gap-2.5 text-[0.9375rem] text-muted">
                      <Dot className="mt-0.5 size-5 shrink-0 text-violet" aria-hidden />
                      {pain}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="mt-16">
                  <H2>The vision</H2>
                </div>
                <p className="mt-5 font-display text-[clamp(1.2rem,1rem+0.9vw,1.5rem)] font-bold leading-snug tracking-[-0.025em] text-violet">
                  {product.vision.headline}
                </p>
                <div className="mt-5 space-y-5">
                  {product.vision.body.map((paragraph) => (
                    <p key={paragraph} className="text-[1.0625rem] leading-relaxed text-ink-soft">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="mt-16">
                  <H2>What it does</H2>
                </div>
                <ol className="mt-8 space-y-10">
                  {product.modules.map((module, i) => (
                    <li key={module.title} className="border-t border-line pt-6">
                      <div className="flex gap-5">
                        <span className="label shrink-0 pt-1.5 text-violet">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="font-display text-lg font-bold tracking-[-0.025em] text-ink">
                            {module.title}
                          </h3>
                          <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-soft">
                            {module.body}
                          </p>
                          {module.bullets && (
                            <ul className="mt-5 space-y-2.5">
                              {module.bullets.map((bullet) => (
                                <li
                                  key={bullet}
                                  className="flex items-start gap-3 text-[0.9375rem] text-muted"
                                >
                                  <span
                                    aria-hidden
                                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet/50"
                                  />
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>

              {product.architecture && (
                <Reveal delay={0.05}>
                  <div className="mt-16">
                    <H2>How it is put together</H2>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {product.architecture.map((layer) => (
                      <li key={layer.layer} className="rounded-[22px] border border-line bg-surface p-7">
                        <p className="label text-violet">{layer.layer} layer</p>
                        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                          {layer.body}
                        </p>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {layer.items.map((item) => (
                            <li
                              key={item}
                              className="rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-muted"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {product.roadmap && (
                <Reveal delay={0.05}>
                  <div className="mt-16">
                    <H2>Where it is up to</H2>
                  </div>
                  <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">
                    {product.name} is {STATUS_LABEL[product.status].toLowerCase()}. This is what is
                    built and what is next — kept current rather than aspirational.
                  </p>
                  <ol className="mt-8 space-y-1">
                    {product.roadmap.map((stage) => (
                      <li key={stage.stage} className="flex gap-4 border-t border-line py-5">
                        <span
                          aria-hidden
                          className={
                            stage.done
                              ? "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-violet text-white"
                              : "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-dashed border-line bg-canvas"
                          }
                        >
                          {stage.done && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <div>
                          <p className="font-display font-bold tracking-[-0.02em] text-ink">
                            {stage.stage}
                            <span className="label ml-3 align-middle text-muted">
                              {stage.done ? "Built" : "Next"}
                            </span>
                          </p>
                          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
                            {stage.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              )}

              <Reveal delay={0.05}>
                <p className="mt-16 border-l-2 border-violet pl-7 font-display text-[clamp(1.2rem,1rem+0.9vw,1.55rem)] font-semibold leading-snug tracking-[-0.025em] text-ink">
                  {product.closing}
                </p>
              </Reveal>
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-[26px] border border-line bg-surface p-8">
                <p className="label text-muted">Status</p>
                <div className="mt-3">
                  <StatusPill status={product.status} />
                </div>

                <p className="label mt-8 text-muted">Built for</p>
                <ul className="mt-4 space-y-2">
                  {product.audience.map((who) => (
                    <li key={who} className="font-medium text-ink">
                      {who}
                    </li>
                  ))}
                </ul>

                <p className="label mt-8 text-muted">Stack</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {product.stack.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>

                {product.projectUrl && (
                  <a
                    href={product.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-violet underline-offset-4 hover:underline"
                  >
                    {product.projectUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ArrowUpRight
                      className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </a>
                )}
              </div>

              <Link
                href={`/software/${next.slug}`}
                className="group mt-5 flex items-center justify-between gap-4 rounded-[26px] border border-line bg-surface p-8 transition-colors hover:border-violet/30"
              >
                <span>
                  <span className="label block text-muted">Next product</span>
                  <span className="mt-2 block font-display text-lg font-bold text-ink">
                    {next.name}
                  </span>
                </span>
                <ArrowUpRight className="size-5 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet" />
              </Link>

              <Link
                href="/software"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden />
                All software
              </Link>
            </aside>
          </div>
        </div>
      </article>

      <CtaBand
        title={unreleased ? "Want early access?" : "Need something like this built?"}
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
