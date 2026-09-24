import { images, site } from "@/content/site";
import { HeroBackdrop } from "@/components/motion/ScrollEffects";

export function Hero() {
  return (
    <section className="hero hero-v2" aria-label="Good ideas. Better systems.">
      <HeroBackdrop
        {...images.hero}
        alt={images.hero.alt}
        // On phones the art is cover-cropped into a portrait box, so it is
        // drawn roughly twice the viewport width.
        sizes="(max-width: 700px) 215vw, (max-width: 1000px) 100vw, 81vw"
        quality={90}
        loading="eager"
        fetchPriority="high"
      />
      <div className="wrap hero-content">
        {/* Content box of the column: absolute items align to its edges. */}
        <div className="hero-inner">
          <div className="eyebrow">
            <span>Nepal / Working everywhere</span>
          </div>
          <div className="hero-copy">
            <h1>
              <span className="title-line">
                <span>Good ideas.</span>
              </span>
              <span className="title-line">
                <span>Better</span>
              </span>
              <span className="title-line">
                <span>
                  <em>systems.</em>
                </span>
              </span>
            </h1>
            <p>
              We design websites, build software and connect
              <br className="desktop-break" /> the systems that make your
              business work.
            </p>
            <a className="button blue" href={site.contactUrl}>
              Book a free consultation <span>↗</span>
            </a>
          </div>
          <div className="hero-caption">
            <span className="caption-rule" />
            From scattered to connected.
          </div>
          <div className="hero-foot">
            <span>Strategy × Design × Engineering</span>
            <a href="#intro">
              Scroll to see what comes together{" "}
              <span className="scroll-indicator">↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
