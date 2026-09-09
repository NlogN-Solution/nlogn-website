import type { Metadata } from "next";
import { Suspense } from "react";
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
import { getPublishedResources } from "@/server/services/resource.service";
import { ResourceLibrary } from "@/components/resources/library";
import { LinkNotice } from "@/components/resources/link-notice";
import { EngagementProvider } from "@/components/engagement/provider";
import { engagementKey } from "@/lib/engagement";

export const metadata: Metadata = buildMetadata({
  title: "Resources — templates, repos and everything we publish",
  description:
    "Free and email-gated developer resources: starter repos, workflow templates, asset packs and snippets — alongside the insights, posts and case studies behind them.",
  path: "/resources",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Resources", path: "/resources" },
];

const icons = { insights: Lightbulb, blog: BookOpen, caseStudies: Trophy } as const;

/**
 * Revalidated rather than dynamic, for the same reason the blog index is: the
 * three editorial shelves come from committed files and the library comes from
 * the CMS, and a new resource should appear within the minute without giving up
 * prerendered delivery. The expired-link notice reads the query in a client
 * component so this page keeps that.
 */
export const revalidate = 60;

export default async function ResourcesPage() {
  const insights = getPostsByKind("insight");
  const posts = getPostsByKind("post");
  const resources = await getPublishedResources();

  // Every card on the page, asked for in one request after hydration. The
  // page is cached by ISR, so these numbers cannot be rendered into it.
  const keys = resources.map((resource) => engagementKey("RESOURCE", resource.slug));

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
            Take it and <span className="text-gradient-violet">build something</span>
          </>
        }
        lead="Starter repos, workflow templates, asset packs and snippets from the work we actually ship. Most of it is a click away; a few things ask for an email so we can send you the file."
        crumbs={crumbs}
      />

      <div className="container-x py-16 md:py-24">
        <Suspense fallback={null}>
          <LinkNotice />
        </Suspense>

        {resources.length > 0 ? (
          <EngagementProvider keys={keys}>
            <ResourceLibrary resources={resources} />
          </EngagementProvider>
        ) : (
          <div className="rounded-[26px] border border-dashed border-line bg-surface px-8 py-14 text-center">
            <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-ink">
              The library is being stocked
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted">
              The first templates and repos land here shortly. In the meantime, everything we have
              written is below.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-canvas">
        <div className="container-x py-16 md:py-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.6rem,1.2rem+1.6vw,2.2rem)] font-extrabold tracking-[-0.035em] text-ink">
              And everything we publish
            </h2>
          </Reveal>

          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
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

                    <h3 className="mt-7 font-display text-xl font-bold tracking-[-0.03em] text-ink">
                      {section.name}
                    </h3>
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
            hasPart: [
              ...resources.map((resource) => ({
                "@type": "CreativeWork",
                name: resource.title,
                url: absoluteUrl(`/resources/${resource.slug}`),
                description: resource.summary ?? undefined,
              })),
              ...sections.map((s) => ({
                "@type": "CollectionPage",
                name: s.name,
                url: absoluteUrl(s.href),
                description: s.blurb,
              })),
            ],
          },
        ]}
        id="resources-schema"
      />
    </>
  );
}
