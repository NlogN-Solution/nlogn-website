"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Code2, Target, TrendingUp, Workflow } from "lucide-react";
import { method } from "@/config/site";

/**
 * The four things nlogn does, as one method rather than four services.
 *
 * A hairline runs behind the row and shows through the gaps, so the cards read
 * as a sequence; each lifts off the band on hover.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const icons = {
  target: Target,
  code: Code2,
  trend: TrendingUp,
  flow: Workflow,
} as const;

export function Method() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const play = reduced || inView;

  return (
    <div ref={ref} className="relative mt-14">
      {/* the thread the four sit on — visible only in the gaps between cards */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scaleX: play ? 1 : 0 }}
        transition={{ duration: 1.1, ease: EASE }}
        className="absolute left-0 top-[3.5rem] hidden h-px w-full origin-left bg-[linear-gradient(90deg,transparent,var(--color-line)_10%,var(--color-line)_90%,transparent)] lg:block"
      />

      <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {method.map((step, i) => {
          const Icon = icons[step.icon];
          return (
            <motion.li
              key={step.n}
              initial={false}
              animate={play ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
            >
              <div className="group relative h-full overflow-hidden rounded-[24px] border border-line bg-[linear-gradient(165deg,#fbfaff_0%,#f5f2fb_100%)] p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:bg-[linear-gradient(165deg,#ffffff_0%,#ffffff_100%)] hover:shadow-lift">
                {/* the numeral, as a watermark */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-1 -top-5 font-display text-[5.5rem] font-extrabold leading-none tracking-[-0.07em] text-violet/[0.07] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-violet/[0.12]"
                >
                  {step.n}
                </span>
                {/* and the glow it sits in, on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-[radial-gradient(closest-side,rgba(108,71,255,0.16),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative">
                  <span className="grid size-12 place-items-center rounded-[0.9rem] bg-violet-wash text-violet transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:bg-violet group-hover:text-white group-hover:shadow-[0_12px_26px_-10px_rgba(108,71,255,0.9)]">
                    <Icon className="size-5" strokeWidth={1.9} aria-hidden />
                  </span>

                  <p className="label mt-7 text-violet">{step.n}</p>
                  <h3 className="mt-2.5 font-display text-xl font-bold tracking-[-0.03em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>

                  <span aria-hidden className="mt-7 block h-px w-full bg-line">
                    <span className="block h-px w-0 bg-[linear-gradient(90deg,#a78bfa,#6c47ff)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                  </span>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
