import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { WorkCard } from "@/components/work/work-card";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getMergedWorks } from "@/server/public-content";
import { absoluteUrl } from "@/lib/utils";

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
            Proof, with the <span className="text-gradient-violet">receipts attached</span>
          </>
        }
        lead={`${works.length} project${works.length === 1 ? "" : "s"}, each with a baseline, a change, and a measured result. Every number below came from the client's own analytics, not ours.`}
        crumbs={crumbs}
      >
        <Button href="/works" variant="secondary" arrow>
          See how we work
        </Button>
      </PageHero>

      <div className="container-x py-16 md:py-24">
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
          {works.map((work, i) => (
            <Reveal as="li" key={work.slug} delay={(i % 2) * 0.08}>
              <WorkCard work={work} />
            </Reveal>
          ))}
        </ul>
      </div>

      <CtaBand title="Your case study is the next one." />

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
