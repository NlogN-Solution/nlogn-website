import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { ClientsSection } from "@/components/home/clients-section";
import { GrowthPath } from "@/components/home/growth-path";
import { PackagesPreview } from "@/components/home/packages-preview";
import { VideoShowcase } from "@/components/home/video-showcase";
import { WorksSection } from "@/components/home/works-section";
import { ProcessSection } from "@/components/home/process-section";
import { TrustSection } from "@/components/home/trust-section";
import { Testimonials } from "@/components/home/testimonials";
import { BlogPreview } from "@/components/home/blog-preview";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, faqSchema } from "@/lib/seo";
import { faqs, siteConfig } from "@/config/site";
import { capabilities } from "@/config/capabilities";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "nlogn — Digital growth agency for your business",
  description:
    "We help businesses grow, reach more customers, and operate smarter through digital growth strategies, marketing, automation, and technology.",
  path: "/",
});

export default function HomePage() {
  const serviceList = {
    "@type": "ItemList",
    name: "Areas of work",
    itemListElement: capabilities.map((capability, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: capability.label,
        description: capability.description,
        url: absoluteUrl("/works"),
        provider: { "@id": absoluteUrl("/#organization") },
        areaServed: "Worldwide",
      },
    })),
  };

  const videoSchema = {
    "@type": "VideoObject",
    name: "How nlogn works — inside a real engagement",
    description:
      "An eight-minute walkthrough of an nlogn engagement, from the opening audit to the post-launch growth dashboard.",
    thumbnailUrl: [absoluteUrl("/opengraph-image")],
    uploadDate: "2026-01-15T09:00:00+05:45",
    duration: "PT8M12S",
    publisher: { "@id": absoluteUrl("/#organization") },
    contentUrl: siteConfig.videoUrl || absoluteUrl("/videos/how-we-work.mp4"),
  };

  return (
    <>
      <Hero />
      <ClientsSection />
      <GrowthPath />
      <PackagesPreview />
      <VideoShowcase />
      <WorksSection />
      <ProcessSection />
      <TrustSection />
      <Testimonials />
      <BlogPreview />
      <FaqSection />
      <CtaBand />
      <JsonLd schema={[serviceList, videoSchema, faqSchema(faqs)]} id="home-schema" />
    </>
  );
}
