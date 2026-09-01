import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { SoftwareCard } from "@/components/home/software-card";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { softwareProducts, productsByReadiness } from "@/config/software";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Software — the platforms we build, run and ship",
  description:
    "ED360 and Ignition running in production, plus the products currently in development: consultancy CRM, admissions, hospitality operations, legal practice management and business reporting.",
  path: "/software",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Software", path: "/software" },
];

export default function SoftwareIndexPage() {
  const products = productsByReadiness();
  const shipped = products.filter((p) => p.status !== "development").length;
  const building = products.length - shipped;

  return (
    <>
      <PageHero
        eyebrow="Software"
        title={
          <>
            Platforms we build, run and{" "}
            <span className="text-gradient-violet">keep shipping</span>
          </>
        }
        lead={`Not client websites — products. ${shipped} running with real users today, ${building} in active development. Each one has a full write-up covering the problem it solves, what it does and how it is put together.`}
        crumbs={crumbs}
      >
        <Button href="/contact" variant="violet" arrow>
          Talk about a build
        </Button>
      </PageHero>

      <div className="container-x py-16 md:py-24">
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {products.map((product, i) => (
            <Reveal as="li" key={product.slug} delay={(i % 2) * 0.08} className="h-full">
              <SoftwareCard product={product} />
            </Reveal>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Products marked <strong className="font-semibold text-ink-soft">In development</strong> are
          being built now and are not yet available. Their write-ups describe the product as
          designed, without screenshots of an interface that is not finished.
        </p>
      </div>

      <CtaBand
        title="Outgrown the spreadsheet?"
        lead="Most of these started as one business running its operation across five tools. Tell us what yours looks like and we will tell you honestly whether software is the answer."
      />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: "Software",
            url: absoluteUrl("/software"),
            isPartOf: { "@id": absoluteUrl("/#website") },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: softwareProducts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/software/${p.slug}`),
                name: `${p.name} — ${p.tagline}`,
              })),
            },
          },
        ]}
        id="software-index-schema"
      />
    </>
  );
}
