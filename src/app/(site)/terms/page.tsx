import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Terms of service",
  description:
    "The terms that govern use of the nlogn website and the basis on which we take on client work.",
  path: "/terms",
});

const sections = [
  {
    h: "Using this website",
    p: [
      "The content here is published for information. Case study figures are reported by our clients' own analytics and are accurate as at the date of publication; they are not a forecast of what your project will return.",
    ],
  },
  {
    h: "Engagements",
    p: [
      "Client work is governed by a separate written agreement covering scope, fees, timeline and intellectual property. Nothing on this website forms an offer or a contract, and estimates shown here are indicative starting points rather than quotes.",
    ],
  },
  {
    h: "Ownership of work",
    p: [
      "On full payment, all deliverables we produce for you — code, design files, content and documentation — are yours outright. We retain the right to describe the work publicly unless the agreement says otherwise, and we will always ask before publishing a number.",
    ],
  },
  {
    h: "Intellectual property on this site",
    p: [
      "The nlogn name, wordmark, written content and site design belong to us. You are welcome to quote from the blog with attribution and a link.",
    ],
  },
  {
    h: "Liability",
    p: [
      "We do not warrant that this website will be uninterrupted or error free, and to the extent permitted by law we are not liable for loss arising from reliance on its content. Liability under a client agreement is capped and defined in that agreement.",
    ],
  },
  {
    h: "Governing law",
    p: [
      "These terms are governed by the laws of Nepal. Disputes are subject to the exclusive jurisdiction of the courts of Kathmandu, unless a signed client agreement specifies otherwise.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of service"
        lead={`The terms on which ${siteConfig.legalName} publishes this website and takes on work. Last updated 1 August 2026.`}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ]}
      />
      <div className="container-x py-16 md:py-24">
        <div className="prose-nlogn max-w-2xl">
          {sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
