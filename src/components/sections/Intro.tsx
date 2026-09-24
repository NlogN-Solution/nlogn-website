"use client";

import { useRef } from "react";
import { images } from "@/content/site";
import { InkText, ParallaxImage } from "@/components/motion/ScrollEffects";
import { VariableProximity } from "@/components/motion/VariableProximity";

// Space Grotesk's weight axis runs 300–700; the heading rests at 500.
const proximity = {
  fromFontVariationSettings: "'wght' 500",
  toFontVariationSettings: "'wght' 700",
  radius: 120,
  falloff: "linear",
} as const;

export function Intro() {
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <section className="intro wrap">
      <div>
        <p className="eyebrow">01 / Why we exist</p>
        <h2 ref={title} className="statement">
          {/* Spaces keep words apart where phones hide the line breaks. */}
          <VariableProximity label="Your business has enough" containerRef={title} {...proximity} />{" "}
          <br />
          <VariableProximity label="moving parts." containerRef={title} {...proximity} />{" "}
          <br />
          <InkText>
            <VariableProximity
              label="Let’s make them work together."
              containerRef={title}
              {...proximity}
            />
          </InkText>
        </h2>
        <div className="intro-bottom">
          <p>
            A website that brings people in. Software that helps your team deliver.
            Automation that takes the repetition out of the day. We connect the pieces
            around the way your business actually works.
          </p>
          <a className="text-link" href="#services">
            Find your starting point ↗
          </a>
        </div>
      </div>
      <figure className="intro-art">
        <div className="intro-frame">
          <ParallaxImage
            {...images.movingParts}
            alt={images.movingParts.alt}
            trackSelector=".intro-frame"
            quality={90}
            sizes="(max-width: 700px) 90vw, 40vw"
          />
        </div>
        <figcaption>
          <span className="caption-rule" />
          Different parts. One motion.
        </figcaption>
      </figure>
    </section>
  );
}
