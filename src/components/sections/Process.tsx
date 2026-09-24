"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { images, processSteps } from "@/content/site";
import { useScrollFrame } from "@/components/motion/MotionProvider";

const pad = (n: number) => String(n).padStart(2, "0");

export function Process() {
  const [active, setActive] = useState(-1);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  // The step nearest 38% down the viewport becomes the active one.
  useScrollFrame(({ vh, paused }) => {
    if (paused) return;
    let nearest = 0;
    let distance = Infinity;
    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs(el.getBoundingClientRect().top - vh * 0.38);
      if (d < distance) {
        nearest = i;
        distance = d;
      }
    });
    setActive(nearest);
  });

  const current = Math.max(active, 0);

  return (
    <section className="process wrap" id="process">
      <p className="eyebrow reveal">04 / How it comes together</p>
      <div className="process-grid">
        <div className="process-visual">
          <div className="process-meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${(current + 1) / processSteps.length})` }} />
          </div>
          <h2>
            First, understand.
            <br />
            Then, <em>make.</em>
          </h2>
          <Image
            {...images.process}
            alt={images.process.alt}
            // Renders 1024px tall and cover-crops, so it needs the full source width.
            sizes="1536px"
          />
          <div className="process-status">
            <span>{processSteps[current].phase}</span>
            <b>
              {pad(current + 1)} / {pad(processSteps.length)}
            </b>
          </div>
          <p>Good systems start with good questions.</p>
        </div>
        <div className="steps">
          {processSteps.map((step, i) => (
            <article
              key={step.title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className={i === active ? "active" : undefined}
            >
              <span>{pad(i + 1)}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <small>{step.outcome}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
