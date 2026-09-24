import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CurtainReveal } from "@/components/motion/CurtainReveal";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ReadingProgress } from "@/components/motion/ScrollEffects";
import { Contact } from "@/components/sections/Contact";
import { ClientStrip } from "@/components/sections/ClientStrip";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { Notes } from "@/components/sections/Notes";
import { Process } from "@/components/sections/Process";
import { ScatterCluster } from "@/components/sections/ScatterCluster";
import { Services } from "@/components/sections/Services";
import { Studio } from "@/components/sections/Studio";
import { Work } from "@/components/sections/Work";

export default function Home() {
  return (
    <MotionProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
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
    </MotionProvider>
  );
}
