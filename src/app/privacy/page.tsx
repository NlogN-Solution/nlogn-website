import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = buildMetadata({
  title: "Privacy policy",
  description:
    "What data the nlogn website collects, why, how long it is kept, and how to have it removed.",
  path: "/privacy",
});

const sections = [
  {
    h: "What we collect",
    p: [
      "When you submit the contact form we receive the name, email address, company, budget range, service interest and message you enter. When you subscribe to The Growth Brief we receive your email address only.",
      "We record aggregate analytics — pages viewed, referring source, country, device type — using a privacy-respecting configuration that does not build cross-site profiles. Our server logs retain IP addresses for rate limiting and abuse prevention.",
    ],
  },
  {
    h: "Why we collect it",
    p: [
      "To reply to your enquiry, to send the newsletter you asked for, to keep the site available and free of spam, and to understand which pages are useful. We do not sell, rent or share your data with advertisers.",
    ],
  },
  {
    h: "How long we keep it",
    p: [
      "Enquiry emails are kept for three years in our mailbox so we can pick up past conversations. Newsletter subscriptions are kept until you unsubscribe. Rate-limiting records are discarded within an hour. Aggregate analytics are retained for 26 months.",
    ],
  },
  {
    h: "Third parties",
    p: [
      "The site is hosted on Vercel. Transactional email is delivered through our SMTP provider. Fonts are served from Google Fonts. Each of these processes data on our behalf under their own terms, and each may briefly see your IP address as part of delivering the page.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "You can ask us what we hold about you, ask for it to be corrected, or ask for it to be deleted. Email us and we will action it within 30 days. If you are in the EU or UK, you also have the right to complain to your local data protection authority.",
    ],
  },
  {
    h: "Cookies",
    p: [
      "The website itself sets no advertising or tracking cookies. Analytics runs cookieless. If that ever changes, this page changes first and you will see a consent prompt.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        lead={`How ${siteConfig.legalName} handles the data this website collects. Last updated 1 August 2026.`}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
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
          <section>
            <h2>Contact</h2>
            <p>
              Questions about this policy go to{" "}
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>, or by post to{" "}
              {siteConfig.address.street}, {siteConfig.address.city},{" "}
              {siteConfig.address.countryName}.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
