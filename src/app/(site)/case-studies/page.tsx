import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { WorkCard } from "@/components/work/work-card";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getMergedWorks } from "@/server/public-content";
import { absoluteUrl } from "@/lib/utils";
import { EngagementProvider } from "@/components/engagement/provider";
import { engagementKey } from "@/lib/engagement";

export const metadata: Metadata = buildMetadata({
  title: "Case studies — the work and the numbers behind it",
  description:
    "Five engagements with published results: +240% direct orders, 3.4x signup conversion, search response from 11s to 1.2s. What we changed, why, and what it returned.",
  path: "/case-studies",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Case studies", path: "/case-studies" },
];

export const revalidate = 60;

export default async function CaseStudiesPage() {
  const works = await getMergedWorks();

  return (
    <>
      <PageHero
        eyebrow="Case studies"
        title={
          <>
            Proof, with the <em>receipts attached.</em>
          </>
        }
        lead={`${works.length} project${works.length === 1 ? "" : "s"}, each with a baseline, a change, and a measured result. Every number below came from the client's own analytics, not ours.`}
        crumbs={crumbs}
      >
        <Button href="/works" variant="secondary" arrow>
          See what we do
        </Button>
      </PageHero>

      <EngagementProvider keys={works.map((w) => engagementKey("CASE_STUDY", w.slug))}>
        <section className="page-section">
          <div className="wrap">
            <ul className="cards" style={{ "--cols": 2 } as React.CSSProperties}>
              {works.map((work, i) => (
                <li key={work.slug} className="reveal">
                  <WorkCard work={work} index={i} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </EngagementProvider>

      <CtaBand
        title={
          <>
            Your case study is <em>the next one.</em>
          </>
        }
      />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: "Case studies",
            url: absoluteUrl("/case-studies"),
            isPartOf: { "@id": absoluteUrl("/#website") },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: works.map((w, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/case-studies/${w.slug}`),
                name: `${w.client} — ${w.title}`,
              })),
            },
          },
        ]}
        id="case-studies-schema"
      />
    </>
  );
}
