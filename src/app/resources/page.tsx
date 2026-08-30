import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Lightbulb, Trophy } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getPostsByKind } from "@/lib/blog";
import { works } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Resources — insights, blog and case studies",
  description:
    "Everything we publish in one place: long-form insights on what moves a number, practical posts from the build, and case studies with the results attached.",
  path: "/resources",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Resources", path: "/resources" },
];

const icons = { insights: Lightbulb, blog: BookOpen, caseStudies: Trophy } as const;

export default function ResourcesPage() {
  const insights = getPostsByKind("insight");
  const posts = getPostsByKind("post");

  const sections = [
    {
      key: "insights" as const,
      href: "/insights",
      name: "Insights",
      count: `${insights.length} pieces`,
      blurb:
        "Longer arguments about the decisions that move a number — what to diagnose first, what an audit should surface, and which work compounds.",
      latest: insights.slice(0, 3),
    },
    {
      key: "blog" as const,
      href: "/blog",
      name: "Blog",
      count: `${posts.length} posts`,
      blurb:
        "Field notes from the build: rendering strategy, structured data, migrations. Practical, specific, and written while the work was still fresh.",
      latest: posts.slice(0, 3),
    },
    {
      key: "caseStudies" as const,
      href: "/case-studies",
      name: "Case studies",
      count: `${works.length} engagements`,
      blurb:
        "What we changed for a client, why we chose it, and what it returned — with the baseline published alongside the result.",
      latest: works.slice(0, 3).map((w) => ({ slug: w.slug, title: `${w.client} — ${w.title}` })),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={
          <>
            Everything we <span className="text-gradient-violet">publish</span>
          </>
        }
        lead="Three shelves. The thinking, the practice, and the proof — all of it written by the people who did the work."
        crumbs={crumbs}
      />

      <div className="container-x py-16 md:py-24">
        <ul className="grid gap-5 lg:grid-cols-3">
          {sections.map((section, i) => {
            const Icon = icons[section.key];
            return (
              <Reveal as="li" key={section.key} delay={i * 0.08} className="h-full">
                <Link
                  href={section.href}
                  className="group flex h-full flex-col rounded-[26px] border border-line bg-surface p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift md:p-9"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-[0.9rem] bg-violet-wash text-violet transition-all duration-500 group-hover:-translate-y-0.5 group-hover:bg-violet group-hover:text-white">
                      <Icon className="size-5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 text-muted transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet"
                    />
                  </div>

                  <h2 className="mt-7 font-display text-xl font-bold tracking-[-0.03em] text-ink">
                    {section.name}
                  </h2>
                  <p className="label mt-2 text-violet">{section.count}</p>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                    {section.blurb}
                  </p>

                  <ul className="mt-7 flex-1 space-y-3 border-t border-line-soft pt-6">
                    {section.latest.map((item) => (
                      <li
                        key={item.slug}
                        className="flex gap-2.5 text-[0.9375rem] leading-snug text-ink-soft"
                      >
                        <span aria-hidden className="mt-[0.55em] size-1 shrink-0 rounded-full bg-violet/50" />
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>

      <CtaBand title="Read enough? Let's talk about your number." />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: "Resources",
            url: absoluteUrl("/resources"),
            isPartOf: { "@id": absoluteUrl("/#website") },
            hasPart: sections.map((s) => ({
              "@type": "CollectionPage",
              name: s.name,
              url: absoluteUrl(s.href),
              description: s.blurb,
            })),
          },
        ]}
        id="resources-schema"
      />
    </>
  );
}
