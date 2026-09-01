import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { Reveal } from "@/components/ui/reveal";
import { Accordion } from "@/components/ui/accordion";
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
  { icon: Mail, label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  {
    icon: Phone,
    label: "Phone",
    value: siteConfig.phoneDisplay,
    href: `tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`,
  },
  {
    icon: MapPin,
    label: "Studio",
    value: `${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.countryName}`,
  },
  { icon: Clock, label: "Hours", value: "Mon–Fri, 9:00–18:00 NPT (UTC+5:45)" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Tell us the number you <span className="text-gradient-violet">need to move</span>
          </>
        }
        lead="Not the brief, not the page count — the metric. We will come back within one working day with a straight answer on whether we can move it, and roughly what that costs."
        crumbs={crumbs}
      />

      <section className="container-x py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <Reveal>
            <Suspense
              fallback={
                <div className="h-[42rem] rounded-[26px] border border-line bg-surface" />
              }
            >
              <ContactForm />
            </Suspense>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-5">
              <ul className="divide-y divide-line rounded-[26px] border border-line bg-surface">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex gap-4 p-7">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-wash text-violet">
                      <Icon className="size-4" strokeWidth={1.9} aria-hidden />
                    </span>
                    <span>
                      <span className="label block text-muted">{label}</span>
                      {href ? (
                        <a
                          href={href}
                          className="mt-1.5 block font-medium text-ink transition-colors hover:text-violet"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="mt-1.5 block font-medium text-ink">{value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="rounded-[26px] bg-ink p-8">
                <p className="label text-violet-soft">Working internationally</p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/70">
                  About half our clients are in Australia, the UK and the Gulf. We hold a
                  four-hour overlap with your working day and run projects
                  asynchronously in writing, so you always have a written record rather
                  than a meeting you have to remember.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x pb-16 md:pb-24">
        <h2 className="font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.25rem)] font-extrabold tracking-tight text-ink">
          Before you write
        </h2>
        <div className="mt-8">
          <Accordion items={faqs.slice(0, 4)} />
        </div>
      </section>

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
