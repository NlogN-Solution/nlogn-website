import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Faq } from "@/components/landing/sections/faq";
import { Process } from "@/components/landing/sections/process";
import { ScatterCluster } from "@/components/landing/sections/scatter-cluster";
import { Services } from "@/components/landing/sections/services";
import { Work } from "@/components/landing/sections/work";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { capabilities } from "@/config/capabilities";
import { works } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Areas of work — everything nlogn builds, runs and delivers",
  description:
    "SEO, websites, custom software, AI automation and the systems that connect them — each with the projects and numbers behind it.",
  path: "/works",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/works" },
];

export default function WorksPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={
          <>
            Everything your business needs to <em>grow digitally.</em>
          </>
        }
        lead="From search and websites to software and automation — we build the digital systems that help businesses attract, convert and operate better."
        crumbs={crumbs}
      >
        <a className="button blue" href="#services">
          See every service <span aria-hidden="true">↓</span>
        </a>
      </PageHero>

      {/* The home page's own sections, in the same order and with the same
          motion: the discipline cluster, the service accordion with its
          demos, the work, and the process. */}
      <ScatterCluster />
      <Services eyebrow="01 / What we do" />
      <Work eyebrow="02 / Selected work" />
      <Process eyebrow="03 / How it comes together" />
      <Faq eyebrow="04 / Before we start" />
      <CtaBand title="Let’s make it work." />

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
