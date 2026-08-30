import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/site/cta-band";
import { FaqSection } from "@/components/home/faq-section";
import { PackagesBrowser } from "@/components/packages/packages-browser";
import { GrowthStack } from "@/components/packages/growth-stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { packageFamilies } from "@/config/packages";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Pricing & packages — published starting prices, fixed scope",
  description:
    "Nine package families, three tiers each, with starting prices published. Or skip the tiers and build a custom growth stack around what your business actually needs.",
  path: "/services",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/services" },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Published prices, <span className="text-gradient-violet">fixed before we start</span>
          </>
        }
        lead="Every package below shows what it starts at. The real number comes out of a scoping call and is signed off before any work begins — so the figure you approve is the figure you pay."
        crumbs={crumbs}
      >
        <Button href="/works" variant="secondary" arrow>
          See what we build
        </Button>
      </PageHero>

      {/* ── packages ───────────────────────────────────────────────── */}
      <section id="packages" className="container-x py-16 md:py-24">
        <SectionHeading
          eyebrow="Packages"
          title={
            <>
              Pick a tier, or <span className="text-gradient-violet">combine several</span>
            </>
          }
          lead="Nine families, three tiers each. Prices shown are starting points — the real number comes out of a scoping call and is fixed before work begins."
          className="mb-14"
        />
        <PackagesBrowser />
      </section>

      {/* ── custom stack builder ───────────────────────────────────── */}
      <section id="growth-stack" className="border-t border-line bg-surface py-16 md:py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow="Build your growth stack"
            title={
              <>
                Or skip the packages <span className="text-gradient-violet">entirely</span>
              </>
            }
            lead="Tell us what you need, what you are trying to move, and what already exists. We will build the right system around your business."
            className="mb-14"
          />
          <GrowthStack />
        </div>
      </section>

      <FaqSection />
      <CtaBand />
      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: "Pricing and packages",
            url: absoluteUrl("/services"),
            isPartOf: { "@id": absoluteUrl("/#website") },
          },
          {
            "@type": "OfferCatalog",
            name: "nlogn packages",
            url: absoluteUrl("/services#packages"),
            provider: { "@id": absoluteUrl("/#organization") },
            itemListElement: packageFamilies.map((family, i) => ({
              "@type": "OfferCatalog",
              position: i + 1,
              name: `${family.name} — ${family.system}`,
              description: family.intro,
              itemListElement: family.tiers.map((tier) => ({
                "@type": "Offer",
                name: `${family.name}: ${tier.name}`,
                description: tier.summary,
                category: family.pillar,
                url: absoluteUrl("/services#packages"),
                priceSpecification: {
                  "@type": "PriceSpecification",
                  priceCurrency: "USD",
                  minPrice: tier.from.replace(/[^0-9]/g, "") || undefined,
                  valueAddedTaxIncluded: false,
                },
              })),
            })),
          },
        ]}
        id="pricing-schema"
      />
    </>
  );
}
