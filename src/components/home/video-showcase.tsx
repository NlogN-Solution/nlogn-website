"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { VideoModal } from "@/components/ui/video-modal";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { cloudinaryPoster, cloudinaryVideo } from "@/config/clients";
import { showreelChapters, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const RAW_SRC = siteConfig.videoUrl || "/videos/how-we-work.mp4";
const POSTER = cloudinaryPoster(RAW_SRC);
/**
 * The first six seconds, small and cheap — it only ever loads on hover, so the
 * frame costs one still until someone shows interest.
 */
const PREVIEW_SRC = cloudinaryVideo(RAW_SRC, "q_auto:eco,f_auto,w_720,eo_6");

const RUNTIME = "08:12";

export function VideoShowcase() {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const reduced = useReducedMotion();
  const preview = hovering && !reduced;

  const play = (at: number) => setOpenAt(at);

  return (
    <section className="container-x pb-16 pt-16 md:pb-28 md:pt-24">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-ink px-5 py-10 sm:px-8 md:px-12 md:py-16">
        {/* ── atmosphere ─────────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_-10%,rgba(108,71,255,0.42)_0%,transparent_58%),radial-gradient(60%_50%_at_100%_100%,rgba(167,139,250,0.18)_0%,transparent_65%)]" />
        <GrowthCurve
          width={1200}
          height={400}
          animate={false}
          strokeWidth={1.5}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full opacity-20"
          id="showcase-curve"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-14">
          {/* ── the film ─────────────────────────────────────────────── */}
          <div className="group relative">
            {/* a soft cast under the frame, so it sits on the panel */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgba(108,71,255,0.35),transparent)] opacity-70 blur-xl transition-opacity duration-700 group-hover:opacity-100"
            />

            <button
              type="button"
              onClick={() => play(0)}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onFocus={() => setHovering(true)}
              onBlur={() => setHovering(false)}
              aria-label="Play the studio film"
              className="relative block aspect-video w-full overflow-hidden rounded-[22px] border border-white/12 bg-[linear-gradient(150deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-left shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] backdrop-blur"
            >
              {POSTER ? (
                <>
                  {/* the still, blown up and blurred, so a cut of any shape
                      fills the frame instead of sitting on flat black */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={POSTER}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 size-full scale-125 object-cover opacity-45 blur-2xl saturate-150"
                  />
                  {/* Cloudinary already serves an optimised still; next/image
                      would need the delivery domain allow-listed for no gain. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={POSTER}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "absolute inset-0 size-full object-contain transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]",
                      preview && "opacity-0",
                    )}
                  />
                </>
              ) : (
                <GrowthCurve
                  width={700}
                  height={320}
                  animate={false}
                  strokeWidth={2.5}
                  fill
                  className="absolute inset-x-0 bottom-0 h-3/4 w-full opacity-70"
                  id="poster-curve"
                />
              )}

              {/* the silent teaser, mounted only while the frame is hovered */}
              {preview && (
                <video
                  src={PREVIEW_SRC}
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="none"
                  aria-hidden
                  className="absolute inset-0 size-full object-contain"
                />
              )}

              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,15,0.42)_0%,rgba(11,11,15,0.05)_38%,rgba(11,11,15,0.72)_100%)]"
              />

              {/* what you are looking at, before you press anything */}
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-soft opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-violet-soft" />
                </span>
                <span className="label text-white/75">Studio film</span>
              </span>

              <motion.span
                whileHover={{ scale: 1.06 }}
                className="absolute left-1/2 top-1/2 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-opacity duration-500 md:size-[5.5rem]"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-white/35" />
                <Play className="relative size-6 translate-x-0.5 fill-ink md:size-7" />
              </motion.span>

              <span className="label absolute bottom-5 left-5 text-white/75">
                How we work · {RUNTIME}
              </span>
              <span className="label absolute bottom-5 right-5 hidden text-white/45 sm:block">
                {preview ? "Preview" : "Hover to peek"}
              </span>

              {/* chapter marks, laid on the frame like a scrubber */}
              <span
                aria-hidden
                className="absolute inset-x-5 bottom-[2.9rem] hidden h-px bg-white/15 sm:block"
              >
                {showreelChapters.map((chapter, i) => (
                  <span
                    key={chapter.at}
                    style={{ left: `${(i / showreelChapters.length) * 100}%` }}
                    className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/35"
                  />
                ))}
                <span className="absolute inset-y-0 left-0 w-0 bg-violet-soft transition-[width] duration-[6000ms] ease-linear group-hover:w-full" />
              </span>
            </button>
          </div>

          {/* ── the copy ─────────────────────────────────────────────── */}
          <div>
            <Eyebrow className="border-white/15 bg-white/10 text-white [&_span]:text-white/80">
              Inside the studio
            </Eyebrow>
            <h2 className="mt-6 text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
              See how we work,
              <br />
              <span className="text-violet-soft">before you hire us.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-white/65">
              Eight minutes inside a real engagement: the audit that opens it, the
              decisions we argue about, the build, and the dashboard the client reads
              on the Monday after launch.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <button
                type="button"
                onClick={() => play(0)}
                className="group/cta inline-flex h-12 items-center gap-3 rounded-[0.85rem] bg-white pl-6 pr-2 text-[0.9375rem] font-medium text-ink transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
              >
                Watch the film
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full bg-violet text-white"
                >
                  <Play className="size-3 translate-x-px fill-current" />
                </span>
              </button>

              <Link
                href="/contact"
                className="group/link inline-flex items-center gap-2 text-[0.9375rem] font-medium text-white/70 transition-colors hover:text-white"
              >
                Rather talk it through?
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ── chapters: four doors into the same film ─────────────────── */}
        <div className="relative mt-12 md:mt-16">
          <div className="flex items-center gap-4">
            <span className="label shrink-0 text-white/40">Jump to a chapter</span>
            <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
          </div>

          <ol className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {showreelChapters.map((chapter, i) => (
              <li key={chapter.at} className="relative">
                {/* hairline between cells, drawn only where one is needed */}
                {i % 2 === 1 && (
                  <span
                    aria-hidden
                    className="absolute inset-y-4 -left-4 hidden w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.14),transparent)] sm:block lg:hidden"
                  />
                )}
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute inset-y-4 -left-4 hidden w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.14),transparent)] lg:block"
                  />
                )}

                <button
                  type="button"
                  onClick={() => play(chapter.at)}
                  className="group/ch relative flex size-full flex-col items-start border-t border-white/10 py-5 text-left transition-colors duration-500 hover:border-white/30"
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,#a78bfa,#6c47ff)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/ch:scale-x-100"
                  />

                  <span className="flex w-full items-center gap-3">
                    <span className="label tabular-nums text-violet-soft">{chapter.time}</span>
                    <span
                      aria-hidden
                      className="ml-auto grid size-7 place-items-center rounded-full border border-white/12 text-white/55 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/ch:-translate-y-0.5 group-hover/ch:border-transparent group-hover/ch:bg-violet group-hover/ch:text-white group-hover/ch:shadow-[0_10px_22px_-10px_rgba(108,71,255,0.9)]"
                    >
                      <Play className="size-[0.6875rem] translate-x-px fill-current" />
                    </span>
                  </span>

                  <span className="mt-4 text-[1.0625rem] font-medium leading-tight text-white">
                    {chapter.title}
                  </span>
                  <span className="mt-2 text-[0.875rem] leading-relaxed text-white/45">
                    {chapter.detail}
                  </span>
                  <span className="sr-only">Play from {chapter.time}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <VideoModal
        open={openAt !== null}
        startAt={openAt ?? 0}
        onClose={() => setOpenAt(null)}
      />
    </section>
  );
}
