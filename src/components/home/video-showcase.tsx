"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { motion } from "motion/react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { VideoModal } from "@/components/ui/video-modal";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { processSteps } from "@/config/site";

export function VideoShowcase() {
  const [open, setOpen] = useState(false);

  return (
    <section className="container-x py-16 md:py-28">
      <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-14 md:px-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_85%_10%,rgba(108,71,255,0.4)_0%,transparent_55%)]" />
        <GrowthCurve
          width={1200}
          height={400}
          animate={false}
          strokeWidth={1.5}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full opacity-30"
          id="showcase-curve"
        />

        <div className="relative grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <Eyebrow className="border-white/15 bg-white/10 text-white [&_span]:text-white/80">
              Inside the studio
            </Eyebrow>
            <h2 className="mt-7 text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] font-extrabold leading-[1.05] text-white">
              See how we work,
              <br />
              <span className="text-violet-soft">before you hire us.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-white/65">
              Eight minutes inside a real engagement: the audit that opens it, the
              decisions we argue about, the build, and the dashboard the client reads
              on the Monday after launch.
            </p>

            <ol className="mt-10 space-y-1">
              {processSteps.slice(0, 4).map((step) => (
                <li
                  key={step.n}
                  className="flex items-baseline gap-4 border-t border-white/10 py-3.5 text-sm"
                >
                  <span className="label w-8 shrink-0 text-violet-soft">{step.n}</span>
                  <span className="font-medium text-white">{step.title}</span>
                  <span className="ml-auto text-white/45">{step.duration}</span>
                </li>
              ))}
            </ol>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Play: see how we work"
            className="group relative aspect-video w-full overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(150deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] backdrop-blur"
          >
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,rgba(108,71,255,0.35),transparent_70%)] transition-opacity duration-500 group-hover:opacity-70" />
            <GrowthCurve
              width={700}
              height={320}
              animate={false}
              strokeWidth={2.5}
              fill
              className="absolute inset-x-0 bottom-0 h-3/4 w-full opacity-70"
              id="poster-curve"
            />
            <motion.span
              whileHover={{ scale: 1.06 }}
              className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] md:size-24"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
              <Play className="relative size-7 translate-x-0.5 fill-ink" />
            </motion.span>
            <span className="label absolute bottom-5 left-6 text-white/70">
              How we work · 08:12
            </span>
          </button>
        </div>
      </div>

      <VideoModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
