"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { GrowthVisual } from "@/components/home/growth-visuals";
import { growthPath, type GrowthStep } from "@/config/growth-path";
import { cn } from "@/lib/utils";

/**
 * The approach, read top to bottom.
 *
 * A rail runs the height of the section and fills as you scroll, so the page
 * itself walks through the five steps. Each step lights as it reaches the middle
 * of the viewport and shows what it means across four groups of disciplines.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Step({ step, isLast }: { step: GrowthStep; isLast: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();

  // Two separate states, on purpose. `seen` fires once when the step comes into
  // view and never unsets, so content animates in and stays put — binding it to
  // the highlight below would blank a step that is still fully on screen.
  const seen = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  // A tall dead-zone top and bottom means only the step you are reading lights.
  const inView = useInView(ref, { margin: "-42% 0px -42% 0px" });

  const play = reduced || seen;
  const active = reduced || inView;

  return (
    <li ref={ref} className={cn("relative pl-14 md:pl-20", !isLast && "pb-12 md:pb-16")}>
      {/* the marker, centred on the rail */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1.5 grid size-[1.125rem] place-items-center rounded-full border-2 bg-canvas transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:left-[0.4rem]",
          active ? "scale-110 border-violet" : "border-line",
        )}
      >
        <span
          className={cn(
            "block size-[0.375rem] rounded-full transition-all duration-500",
            active ? "bg-violet" : "bg-line",
          )}
        />
      </span>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span
          className={cn(
            "label transition-colors duration-500",
            active ? "text-violet" : "text-muted/60",
          )}
        >
          {step.n}
        </span>
        <h3 className="font-display text-[1.375rem] font-bold tracking-[-0.03em] text-ink md:text-[1.5rem]">
          {step.title}
        </h3>
      </div>

      <div className="mt-4 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <div>
          <p className="font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.02em] text-ink md:text-lg">
            {step.claim}
          </p>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted md:text-base">
            {step.body}
          </p>
        </div>

        <div
          className={cn(
            "rounded-[1.25rem] border bg-surface p-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-5",
            active ? "border-violet/25 shadow-lift" : "border-line shadow-none",
          )}
        >
          <GrowthVisual name={step.visual} active={play} reduced={!!reduced} />

          <p className="label mt-5 px-1 text-muted/70">What that means for</p>

          {/* a mini rail, echoing the section's own */}
          <motion.ol
            initial={false}
            animate={play ? "on" : "off"}
            variants={{
              on: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
              off: {},
            }}
            className="relative mt-3 px-1"
          >
            <span
              aria-hidden
              className={cn(
                "absolute bottom-4 left-[0.469rem] top-4 w-px transition-colors duration-700",
                active ? "bg-violet/25" : "bg-line",
              )}
            />
            {step.lenses.map((lens) => (
              <motion.li
                key={lens.area}
                variants={{
                  off: { opacity: 0, x: -6 },
                  on: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.5, ease: EASE }}
                className="relative grid gap-0.5 py-2.5 pl-6 sm:grid-cols-[minmax(0,10.75rem)_minmax(0,1fr)] sm:items-baseline sm:gap-4"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-[0.95rem] size-[0.4375rem] rounded-full ring-4 ring-surface transition-colors duration-500",
                    active ? "bg-violet" : "bg-line",
                  )}
                />
                <span className="font-display text-[0.875rem] font-semibold tracking-[-0.01em] text-violet-deep">
                  {lens.area}
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-ink-soft">
                  {lens.detail}
                </span>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </li>
  );
}

export function GrowthPath() {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start 0.65", "end 0.55"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  return (
    <section id="approach" className="container-x py-16 md:py-28">
      <SectionHeading
        eyebrow="Our approach"
        title={
          <>
            From a stuck number to a system that{" "}
            <span className="text-gradient-violet">compounds</span>
          </>
        }
        lead="Five steps, one process, every time. We start by figuring out what actually needs to be done — even if the answer is to build nothing."
        action={
          <Button href="/process" variant="secondary" arrow>
            How an engagement runs
          </Button>
        }
      />

      <div ref={track} className="relative mt-16 md:mt-20">
        {/* the rail: a hairline that the scroll position fills in violet */}
        <div
          aria-hidden
          className="absolute bottom-2 left-[0.5rem] top-2 w-px bg-line md:left-[0.875rem]"
        >
          <motion.div
            className="h-full w-px origin-top bg-[linear-gradient(180deg,#a78bfa,#6c47ff_55%,#4526c9)]"
            style={{ scaleY: reduced ? 1 : fill }}
            transition={{ ease: EASE }}
          />
        </div>

        <ol>
          {growthPath.map((step, i) => (
            <Step key={step.n} step={step} isLast={i === growthPath.length - 1} />
          ))}
        </ol>
      </div>

      <p className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-8 text-[0.9375rem] text-muted md:mt-16">
        <ArrowRight className="size-4 shrink-0 text-violet" aria-hidden />
        Every discipline below is run through those same five steps — which is why they
        report against one number rather than five.
      </p>
    </section>
  );
}
