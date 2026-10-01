import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/landing/layout/footer";
import { Header } from "@/components/landing/layout/header";
import { CurtainReveal } from "@/components/landing/motion/curtain-reveal";
import { MotionProvider } from "@/components/landing/motion/motion-provider";
import { ReadingProgress } from "@/components/landing/motion/scroll-effects";
import { Contact } from "@/components/landing/sections/contact";
import { ClientStrip } from "@/components/landing/sections/client-strip";
import { Faq } from "@/components/landing/sections/faq";
import { Hero } from "@/components/landing/sections/hero";
import { Intro } from "@/components/landing/sections/intro";
import { Notes } from "@/components/landing/sections/notes";
import { Process } from "@/components/landing/sections/process";
import { ScatterCluster } from "@/components/landing/sections/scatter-cluster";
import { Services } from "@/components/landing/sections/services";
import { Studio } from "@/components/landing/sections/studio";
import { Work } from "@/components/landing/sections/work";
import { JsonLd } from "@/components/seo/json-ld";
import { capabilities } from "@/config/capabilities";
import { faqs } from "@/config/landing";
import { buildMetadata, faqSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "nlogn — Digital growth agency for your business",
  description:
    "We help businesses grow, reach more customers, and operate smarter through websites, custom software, search, and AI automation.",
  path: "/",
});

// Matches the page's paper background.
export const viewport: Viewport = {
  themeColor: "#f5f5f2",
};

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

  // The skip link comes from the root layout and targets #main.
  return (
    <MotionProvider>
      <ReadingProgress />
      <Header />
      <main id="main">
        <CurtainReveal
          anchorId="intro"
          curtain={
            <>
              <Hero />
              <ClientStrip />
            </>
          }
        >
          <Intro />
        </CurtainReveal>
        <ScatterCluster />
        <Work />
        <Services />
        <Process />
        <Studio />
        <Notes />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <JsonLd schema={[serviceList, faqSchema(faqs)]} id="home-schema" />
    </MotionProvider>
  );
}
