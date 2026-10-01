import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
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
    "ED360, Chatboq and Ignition running in production — consultancy operations, AI customer communication and admissions — plus Docket, legal practice management currently in development.",
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
            Platforms we build, run and <em>keep shipping.</em>
          </>
        }
        lead={`Not client websites — products. ${shipped} running with real users today, ${building} in active development. Each one has a full write-up covering the problem it solves, what it does and how it is put together.`}
        crumbs={crumbs}
      >
        <Button href="/contact" arrow>
          Talk about a build
        </Button>
      </PageHero>

      <section className="page-section">
        <div className="wrap">
          <ul className="cards" style={{ "--cols": 2 } as React.CSSProperties}>
            {products.map((product, i) => (
              <li key={product.slug} className="reveal">
                <SoftwareCard product={product} index={i} />
              </li>
            ))}
          </ul>
          <p className="lede" style={{ marginTop: 70 }}>
            Products marked <b>In development</b> are being built now and are not yet available.
            Their write-ups describe the product as designed, without screenshots of an interface
            that is not finished.
          </p>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Outgrown <em>the spreadsheet?</em>
          </>
        }
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
