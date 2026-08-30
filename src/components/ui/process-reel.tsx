"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { processSteps } from "@/config/site";

const SCENE_MS = 3600;

/**
 * Fallback reel. Plays when no showreel file is available so the
 * "See how we work" experience still tells the story rather than 404-ing.
 */
export function ProcessReel({ playing = true }: { playing?: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((v) => (v + 1) % processSteps.length), SCENE_MS);
    return () => clearInterval(t);
  }, [playing]);

  const step = processSteps[i];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[inherit] bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_18%,rgba(108,71,255,0.42)_0%,transparent_58%)]" />
      <GrowthCurve
        width={900}
        height={420}
        animate={false}
        strokeWidth={2}
        className="absolute inset-x-0 bottom-0 h-3/4 w-full opacity-40"
        id="reel-curve"
      />

      <div className="relative flex h-full flex-col justify-between p-6 md:p-10">
        <div className="flex items-center justify-between">
          <span className="label text-white/50">nlogn — how we work</span>
          <span className="label text-white/50">
            {String(i + 1).padStart(2, "0")} / {String(processSteps.length).padStart(2, "0")}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg"
          >
            <p className="label text-violet-soft">{step.duration}</p>
            <h3 className="mt-3 font-display text-[clamp(1.8rem,1.2rem+2.2vw,3rem)] font-extrabold leading-none text-white">
              {step.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">{step.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-1.5">
          {processSteps.map((s, idx) => (
            <span key={s.n} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span
                className="block h-full bg-violet-soft"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: idx < i ? 1 : idx === i ? 1 : 0 }}
                transition={{
                  duration: idx === i && playing ? SCENE_MS / 1000 : 0.3,
                  ease: "linear",
                }}
                style={{ transformOrigin: "left" }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
