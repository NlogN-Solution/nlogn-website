import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Quote } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Breadcrumbs } from "@/components/site/page-hero";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { works } from "@/config/site";
import { absoluteUrl, slugify } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const work = works.find((w) => w.slug === slug);
  if (!work)
    return buildMetadata({ title: "Case study not found", description: "", path: "/works", noIndex: true });

  return buildMetadata({
    title: `${work.client} case study — ${work.title}`,
    description: work.summary,
    path: `/works/${work.slug}`,
    type: "article",
  });
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  const work = works.find((w) => w.slug === slug);
  if (!work) notFound();

  const index = works.findIndex((w) => w.slug === work.slug);
  const next = works[(index + 1) % works.length];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Works", path: "/works" },
    { name: work.client, path: `/works/${work.slug}` },
  ];

  return (
    <>
      <article>
        <header className="relative overflow-hidden border-b border-line pb-16 pt-32 md:pb-20 md:pt-44">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: `radial-gradient(80% 60% at 80% 0%, ${work.accent}18 0%, transparent 60%)` }}
          />
          <div className="container-x">
            <Breadcrumbs items={crumbs} />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="label rounded-full border border-line bg-surface px-3.5 py-2 text-ink-soft">
                {work.category}
              </span>
              <span className="label text-muted">{work.year}</span>
              <span className="label text-muted">· {work.duration}</span>
            </div>

            <p className="mt-8 font-display text-[clamp(1.6rem,1.2rem+1.6vw,2.4rem)] font-extrabold tracking-tight text-violet">
              {work.client}
            </p>
            <h1 className="mt-3 max-w-4xl text-[clamp(2.2rem,1.4rem+3.2vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
              {work.title}
            </h1>
            <p className="mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-muted md:text-lg">
              {work.summary}
            </p>
          </div>
        </header>

        <section className="border-b border-line bg-surface" aria-label="Results">
          <div className="container-x">
            <dl className="grid divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
              {work.metrics.map((m, i) => (
                <Reveal key={m.label} delay={i * 0.07} className="py-9 md:px-8 md:first:pl-0 md:last:pr-0">
                  <dd className="font-display text-[clamp(1.9rem,1.4rem+1.6vw,2.75rem)] font-extrabold leading-none tracking-[-0.045em] text-ink">
                    {m.value}
                  </dd>
                  <dt className="mt-3 text-sm text-muted">{m.label}</dt>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <div className="container-x py-16 md:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
            <div className="max-w-2xl">
              <Reveal>
                <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
                  The problem
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">{work.challenge}</p>
              </Reveal>

              <Reveal delay={0.05}>
                <h2 className="mt-16 font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
                  What we did
                </h2>
                <ol className="mt-8 space-y-6">
                  {work.approach.map((step, i) => (
                    <li key={step} className="flex gap-5 border-t border-line pt-6">
                      <span className="label shrink-0 text-violet">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[1.0625rem] leading-relaxed text-ink-soft">{step}</span>
                    </li>
                  ))}
                </ol>
              </Reveal>

              <Reveal delay={0.05}>
                <h2 className="mt-16 font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
                  The result
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">{work.outcome}</p>
              </Reveal>

              {work.testimonial && (
                <Reveal delay={0.05}>
                  <figure className="relative mt-16 overflow-hidden rounded-[26px] bg-ink p-9 md:p-12">
                    <GrowthCurve
                      width={700}
                      height={240}
                      animate={false}
                      strokeWidth={1.5}
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full opacity-30"
                      id="case-quote-curve"
                    />
                    <Quote className="relative size-7 text-violet-soft" aria-hidden />
                    <blockquote className="relative mt-6 font-display text-[clamp(1.25rem,1rem+1vw,1.6rem)] font-semibold leading-snug tracking-[-0.02em] text-white">
                      “{work.testimonial.quote}”
                    </blockquote>
                    <figcaption className="relative mt-7 text-sm text-white/60">
                      <span className="font-semibold text-white">{work.testimonial.name}</span>
                      {" — "}
                      {work.testimonial.role}
                    </figcaption>
                  </figure>
                </Reveal>
              )}
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-[26px] border border-line bg-surface p-8">
                <p className="label text-muted">Services used</p>
                <ul className="mt-4 space-y-2">
                  {work.services.map((s) => (
                    <li key={s} className="font-medium text-ink">
                      {s}
                    </li>
                  ))}
                </ul>

                <p className="label mt-8 text-muted">Stack</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {work.stack.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>

                <p className="label mt-8 text-muted">Engagement</p>
                <p className="mt-2 font-display font-bold text-ink">{work.duration}</p>
              </div>

              <Link
                href={`/works/${next.slug}`}
                className="group mt-5 flex items-center justify-between gap-4 rounded-[26px] border border-line bg-surface p-8 transition-colors hover:border-violet/30"
              >
                <span>
                  <span className="label block text-muted">Next case study</span>
                  <span className="mt-2 block font-display text-lg font-bold text-ink">
                    {next.client}
                  </span>
                </span>
                <ArrowUpRight className="size-5 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet" />
              </Link>

              <Link
                href="/works"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden />
                All case studies
              </Link>
            </aside>
          </div>
        </div>
      </article>

      <CtaBand />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "Article",
            headline: `${work.client}: ${work.title}`,
            description: work.summary,
            url: absoluteUrl(`/works/${work.slug}`),
            author: { "@id": absoluteUrl("/#organization") },
            publisher: { "@id": absoluteUrl("/#organization") },
            datePublished: `${work.year}-01-01`,
            about: work.services.map((s) => ({ "@type": "Thing", name: s })),
            keywords: [...work.services, work.category, work.client].map(slugify).join(", "),
          },
        ]}
        id="work-schema"
      />
    </>
  );
}
