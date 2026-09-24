import { images } from "@/content/site";
import { ParallaxImage } from "@/components/motion/ScrollEffects";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function Studio() {
  return (
    <section className="studio" id="studio">
      <div className="wrap studio-grid">
        <div className="studio-image">
          <ParallaxImage
            {...images.studio}
            alt={images.studio.alt}
            trackSelector=".studio-image"
            sizes="(max-width: 700px) 90vw, 45vw"
          />
          <ExternalLink className="film-link" href="https://nlogn.online/about">
            Meet the studio on our current site <span>↗</span>
          </ExternalLink>
          <span className="photo-note">From the NLOGN studio film</span>
        </div>
        <div className="studio-copy reveal">
          <p className="eyebrow">05 / The people behind the pixels</p>
          <h2>
            Small team.
            <br />
            Close to
            <br />
            <em>the work.</em>
          </h2>
          <p>
            We’re a four-person digital team in Nepal. The people who understand your
            business are the people who design and build the solution.
          </p>
          <p>
            We bring software, design, automation and marketing into the same
            conversation. Fewer handoffs. More shared understanding.
          </p>
          <a className="text-link" href="#contact">
            Let’s get to know your business ↗
          </a>
          <div className="studio-stamp">
            <span>Nepal → Everywhere</span>
            <span>Strategy / Design / Engineering</span>
          </div>
        </div>
      </div>
    </section>
  );
}
