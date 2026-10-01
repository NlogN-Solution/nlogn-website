import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { Faq } from "@/components/landing/sections/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { faqs, siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Contact nlogn — start a project",
  description:
    "Tell us the number you need to move. We reply to every enquiry within one working day with an honest read on whether we can move it and what it would take.",
  path: "/contact",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

const details = [
  { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  {
    label: "Phone",
    value: siteConfig.phoneDisplay,
    href: `tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`,
  },
  {
    label: "Studio",
    value: `${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.countryName}`,
  },
  { label: "Hours", value: "Mon–Fri, 9:00–18:00 NPT (UTC+5:45)" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Tell us the number you <em>need to move.</em>
          </>
        }
        lead="Not the brief, not the page count — the metric. We will come back within one working day with a straight answer on whether we can move it, and roughly what that costs."
        crumbs={crumbs}
      />

      <section className="page-section">
        <div className="wrap">
          <div className="split">
            <div className="sticky">
              <p className="eyebrow">01 / Reach us directly</p>
              <h2>
                A person replies,
                <br />
                <em>not a form.</em>
              </h2>
              <ul className="rows" style={{ marginTop: 50 }}>
                {details.map(({ label, value, href }) => (
                  <li key={label}>
                    <span className="eyebrow">{label}</span>
                    {href ? <a href={href}>{value}</a> : <span>{value}</span>}
                  </li>
                ))}
              </ul>
              <p className="lede" style={{ marginTop: 30 }}>
                About half our clients are in Australia, the UK and the Gulf. We hold a four-hour
                overlap with your working day and run projects in writing, so you always have a
                record rather than a meeting you have to remember.
              </p>
            </div>
            <div className="site-theme reveal">
              <Suspense fallback={<div className="h-[42rem]" />}>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <Faq
        eyebrow="02 / Before you write"
        title={
          <>
            A few things
            <br />
            you might ask.
          </>
        }
        items={faqs.slice(0, 4)}
      />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "ContactPage",
            url: absoluteUrl("/contact"),
            name: "Contact nlogn",
            isPartOf: { "@id": absoluteUrl("/#website") },
            mainEntity: { "@id": absoluteUrl("/#organization") },
          },
          faqSchema(faqs.slice(0, 4)),
        ]}
        id="contact-schema"
      />
    </>
  );
}
