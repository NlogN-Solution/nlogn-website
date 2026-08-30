import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { CapabilitiesSection } from "@/components/home/capabilities-section";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { capabilities } from "@/config/capabilities";
import { works } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Areas of work — everything nlogn builds, runs and delivers",
  description:
    "Social, creative, SEO, paid growth, websites, custom software, AI automation and the systems that connect them — each with the projects and numbers behind it.",
  path: "/works",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Works", path: "/works" },
];

export default function WorksPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title={
          <>
            Everything your business needs to{" "}
            <span className="text-gradient-violet">grow digitally</span>.
          </>
        }
        lead="From content and campaigns to websites, software and automation — we build the digital systems that help businesses attract, convert and operate better. Every area below lists the projects behind it."
        crumbs={crumbs}
      />

      <CapabilitiesSection withHeading={false} />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: "Areas of work",
            url: absoluteUrl("/works"),
            isPartOf: { "@id": absoluteUrl("/#website") },
            mainEntity: {
              "@type": "ItemList",
              name: "Areas of work",
              itemListElement: capabilities.map((capability, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Service",
                  name: capability.label,
                  description: capability.description,
                  provider: { "@id": absoluteUrl("/#organization") },
                  areaServed: "Worldwide",
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: `${capability.label} services`,
                    itemListElement: capability.services.map((service) => ({
                      "@type": "Offer",
                      itemOffered: { "@type": "Service", name: service },
                    })),
                  },
                },
              })),
            },
            mentions: works.map((work) => ({
              "@type": "CreativeWork",
              name: `${work.client} — ${work.title}`,
              url: absoluteUrl(`/case-studies/${work.slug}`),
            })),
          },
        ]}
        id="works-schema"
      />
    </>
  );
}
