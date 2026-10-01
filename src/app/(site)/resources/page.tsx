import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getPostsByKind } from "@/lib/blog";
import { works } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import { getPublishedResources } from "@/server/services/resource.service";
import { ResourceLibrary } from "@/components/resources/library";
import { LinkNotice } from "@/components/resources/link-notice";

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
            Take it and <em>build something.</em>
          </>
        }
        lead="Starter repos, workflow templates and snippets from the work we actually ship — every one of them a public repository you can clone today. Most are a click away; a few ask for an email so we can send you the link as well."
        crumbs={crumbs}
      />

      <section className="page-section">
        <div className="wrap">
          <div className="site-theme">
            <Suspense fallback={null}>
              <LinkNotice />
            </Suspense>
          </div>

          {resources.length > 0 ? (
            <ResourceLibrary resources={resources} />
          ) : (
            <div className="empty">
              <h2>The library is being stocked</h2>
              <p>
                The first templates and repos land here shortly. In the meantime, everything we
                have written is below.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="page-section is-ruled">
        <div className="wrap">
          <SectionHeading
            eyebrow="And everything we publish"
            aside="Free to read"
            title={
              <>
                Thinking behind
                <br />
                the things <em>we build.</em>
              </>
            }
          />
          <ul className="panels" style={{ "--cols": 3 } as React.CSSProperties}>
            {sections.map((section) => (
              <li key={section.key} className="panel reveal">
                <span className="eyebrow">{section.count}</span>
                <h3>
                  <Link href={section.href}>{section.name}</Link>
                </h3>
                <p>{section.blurb}</p>
                <ul>
                  {section.latest.map((item) => (
                    <li key={item.slug}>{item.title}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Read enough? <em>Let’s talk.</em>
          </>
        }
      />

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
