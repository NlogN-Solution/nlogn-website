"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Clapperboard, Play, Wrench } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import {
  CLIENT_TABS,
  publishedVideos,
  cloudinaryPoster,
  cloudinaryVideo,
  projectsByCategory,
  type ClientCategory,
  type ClientProject,
  type ClientVideo,
} from "@/config/clients";
import { cn } from "@/lib/utils";

/**
 * Recent client work, split by category with a media showcase beneath.
 *
 * Everything renders from `config/clients.ts`; nothing here is hardcoded. Videos
 * stream from Cloudinary and only mount a <video> once played, so opening the
 * page never pulls four files down.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── a project ──────────────────────────────────────────────────────────── */

function ProjectCard({ project }: { project: ClientProject }) {
  const host = project.projectUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const body = (
    <>
      {/* browser chrome, so the shot reads as a live site rather than an image */}
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-5 py-3.5">
        <span aria-hidden className="size-2 rounded-full bg-line" />
        <span aria-hidden className="size-2 rounded-full bg-line" />
        <span aria-hidden className="size-2 rounded-full bg-line" />
        {host && (
          <span className="ml-3 truncate rounded-full bg-surface px-3 py-1 font-mono text-[0.6875rem] text-muted">
            {host}
          </span>
        )}
      </div>

      <div className="relative aspect-[2/1] overflow-hidden bg-canvas-2">
        <Image
          src={project.thumbnail}
          alt={`${project.clientName} — ${project.projectName}`}
          fill
          sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 34rem"
          className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
        />
      </div>

      <div className="flex flex-1 flex-col p-7 md:p-8">
        <p className="label text-violet">{project.sector}</p>
        <h3 className="mt-3 font-display text-xl font-bold tracking-[-0.03em] text-ink">
          {project.clientName}
        </h3>
        <p className="mt-1 text-[0.9375rem] font-medium text-violet-deep">
          {project.projectName}
        </p>
        <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-muted">
          {project.description}
        </p>

        {project.technologies && project.technologies.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink-soft"
              >
                {tech}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex items-center justify-between border-t border-line-soft pt-5">
          <span className="font-display text-[0.9375rem] font-semibold text-ink">
            {project.projectUrl ? "View website" : "Private build"}
          </span>
          {project.projectUrl && (
            <ArrowUpRight
              aria-hidden
              className="size-5 text-muted transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-violet"
            />
          )}
        </div>
      </div>
    </>
  );

  const shell =
    "group flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";

  if (!project.projectUrl) {
    return <article className={shell}>{body}</article>;
  }

  return (
    <a
      href={project.projectUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(shell, "hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift")}
    >
      {body}
      <span className="sr-only">Opens {project.clientName} in a new tab</span>
    </a>
  );
}

/* ── a film ─────────────────────────────────────────────────────────────── */

/**
 * Films are shown as cinema cards: a dark stage holding the frame, a marquee
 * across the top, and a ticket stub torn off underneath carrying the credits.
 * The stage is sized to the source — 9:16 for a reel, 16:9 for a feature — so
 * nothing is ever cropped or letterboxed to fit a grid.
 */
function FilmCard({ video, feature = false }: { video: ClientVideo; feature?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const poster = video.videoPoster ?? cloudinaryPoster(video.videoUrl);
  const portrait = video.aspect === "portrait";

  const stage = (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-black ring-1 ring-white/10",
        portrait ? "aspect-[9/16]" : "aspect-video",
      )}
    >
      {playing ? (
        <video
          src={cloudinaryVideo(video.videoUrl)}
          poster={poster}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="size-full object-cover"
        >
          <track kind="captions" />
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${video.clientName} — ${video.projectName}`}
          className="absolute inset-0 size-full"
        >
          {poster && (
            // Cloudinary serves the still; next/image would need the domain
            // allow-listed, and this is already an optimised delivery URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
          )}

          {/* house lights: a vignette that lifts as the card is hovered */}
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_25%,rgba(4,2,10,0.55)_100%)] transition-opacity duration-700 group-hover:opacity-70"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(4,2,10,0.85))]"
          />

          {/* the projector button */}
          <span
            aria-hidden
            className={cn(
              "absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-[0_18px_45px_-12px_rgba(0,0,0,0.8)] backdrop-blur transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:bg-white",
              feature ? "size-[4.5rem]" : "size-14",
            )}
          >
            <span className="absolute inset-0 rounded-full ring-1 ring-white/40 transition-all duration-700 group-hover:scale-[1.35] group-hover:opacity-0" />
            <Play className={cn("translate-x-0.5 fill-ink", feature ? "size-7" : "size-5")} />
          </span>

          {/* the title card, over the scrim */}
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <span className="min-w-0">
              <span className="block truncate font-display text-[1.0625rem] font-bold tracking-[-0.03em] text-white">
                {video.clientName}
              </span>
              <span className="mt-0.5 block truncate text-[0.8125rem] font-medium text-violet-soft">
                {video.projectName}
              </span>
            </span>
            <span className="label shrink-0 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[0.5625rem] text-white/80 backdrop-blur">
              {portrait ? "9:16" : "16:9"}
            </span>
          </span>
        </button>
      )}
    </div>
  );

  const credits = (
    <div className="relative">
      {/* the tear — a perforated line, notched into both edges of the card */}
      {/* 2.25rem = the card's two paddings (0.5 + 0.5) plus the stub's own
          0.75, plus half a notch — which puts each circle's centre exactly on
          the card edge, where `overflow-hidden` bites the other half off. */}
      <span
        aria-hidden
        className="absolute -left-9 top-0 size-4 -translate-y-1/2 rounded-full bg-canvas"
      />
      <span
        aria-hidden
        className="absolute -right-9 top-0 size-4 -translate-y-1/2 rounded-full bg-canvas"
      />
      <span aria-hidden className="block border-t border-dashed border-white/20" />

      <div className={cn("pt-5", feature ? "" : "min-h-[6.5rem]")}>
        <p className="label text-violet-soft">{video.sector}</p>
        <p className="mt-2.5 text-[0.875rem] leading-relaxed text-white/65">
          {video.description}
        </p>
      </div>
    </div>
  );

  return (
    <figure
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,#16101f_0%,#0b0810_60%,#0d0716_100%)] p-2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/40 hover:shadow-[0_30px_70px_-30px_rgba(69,38,201,0.65)]",
      )}
    >
      {/* marquee */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <span className="flex items-center gap-2">
          <Clapperboard className="size-3.5 text-violet-soft" strokeWidth={2} aria-hidden />
          <span className="label text-[0.5625rem] text-white/55">
            {feature ? "Feature" : "Reel"}
          </span>
        </span>
        <span aria-hidden className="flex items-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-1 w-3 rounded-full bg-white/12" />
          ))}
        </span>
      </div>

      {feature ? (
        <div className="grid flex-1 gap-5 p-2 lg:grid-cols-[1.35fr_1fr] lg:gap-7">
          {stage}
          <figcaption className="flex flex-col justify-center pb-3 pr-3 lg:py-4">
            <p className="label text-violet-soft">{video.sector}</p>
            <h4 className="mt-4 font-display text-[clamp(1.35rem,1rem+1vw,1.9rem)] font-bold leading-[1.1] tracking-[-0.035em] text-white">
              {video.clientName}
            </h4>
            <p className="mt-2 text-[1.0625rem] font-medium text-violet-soft">
              {video.projectName}
            </p>
            <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-white/65">
              {video.description}
            </p>
            <span aria-hidden className="mt-7 block h-px w-full bg-white/12">
              <span className="block h-px w-10 bg-[linear-gradient(90deg,#a78bfa,#6c47ff)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
            </span>
          </figcaption>
        </div>
      ) : (
        <div className="flex flex-1 flex-col p-2">
          {stage}
          <figcaption className="mt-5 px-3 pb-3">{credits}</figcaption>
        </div>
      )}
    </figure>
  );
}

/** The films, arranged as a bill: the wide cut plays as the feature, the
 *  vertical cuts sit under it as the supporting reels. */
function MediaShowcase({ videos }: { videos: ClientVideo[] }) {
  const features = videos.filter((v) => v.aspect === "landscape");
  const reels = videos.filter((v) => v.aspect !== "landscape");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
          </span>
          <span className="label text-ink-soft">Now showing</span>
        </span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="label text-muted">
          {videos.length} {videos.length === 1 ? "film" : "films"}
        </span>
      </div>

      {features.map((video, i) => (
        <Reveal key={video.id} delay={i * 0.06}>
          <FilmCard video={video} feature />
        </Reveal>
      ))}

      {reels.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reels.map((video, i) => (
            <Reveal as="li" key={video.id} delay={(i % 3) * 0.07} className="h-full">
              <FilmCard video={video} />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What each tab says when it has nothing in it yet. */
const EMPTY: Record<ClientCategory, { title: string; body: string }> = {
  websites: {
    title: "Website work is on its way",
    body: "Nothing published under this heading yet. Ask us what we are building right now.",
  },
  media: {
    title: "Films are still in the edit",
    body: "Reels, ads and product cuts land here as they clear client approval. Ask to see the current work in progress.",
  },
  software: {
    title: "Software write-ups are in progress",
    body: "Most of what we build here runs behind a login, so the detail goes into a case study rather than a public link. Ask and we will walk you through one.",
  },
};

/* ── the section ────────────────────────────────────────────────────────── */

export function ClientsSection() {
  const [tab, setTab] = useState<ClientCategory>("websites");

  const isMedia = tab === "media";
  const projects = isMedia ? [] : projectsByCategory(tab);
  const videos = isMedia ? publishedVideos() : [];
  const count = isMedia ? videos.length : projects.length;

  return (
    <section id="clients" className="container-x py-16 md:py-28">
      <SectionHeading
        eyebrow="Recent clients"
        title={
          <>
            Work that is <span className="text-gradient-violet">live and in the wild</span>
          </>
        }
        lead="Sites, films and systems we built for clients, running in production today. Open any of them — they are not mockups."
        action={
          <Button href="/case-studies" variant="secondary" arrow>
            Read the case studies
          </Button>
        }
      />

      {/* tabs */}
      <Reveal delay={0.1}>
        <div
          role="tablist"
          aria-label="Client work by type"
          className="mt-12 flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] md:inline-flex [&::-webkit-scrollbar]:hidden"
        >
          {CLIENT_TABS.map((item) => {
            const active = tab === item.id;
            const tally =
              item.id === "media" ? publishedVideos().length : projectsByCategory(item.id).length;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls={`clients-panel-${item.id}`}
                id={`clients-tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-[0.9375rem] font-medium transition-colors duration-300",
                  active ? "text-white" : "text-ink-soft hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="clients-tab"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
                <span className="relative">
                  {item.label}
                  {tally > 0 && (
                    <span className={cn("ml-2 text-xs", active ? "text-white/60" : "text-muted")}>
                      {tally}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* A floor on the panel stops a tab switch from collapsing the page and
          sliding every section below it up into view. */}
      <div
        role="tabpanel"
        id={`clients-panel-${tab}`}
        aria-labelledby={`clients-tab-${tab}`}
        className="mt-8 min-h-[32rem]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {count > 0 ? (
              isMedia ? (
                <MediaShowcase videos={videos} />
              ) : (
                <ul className="grid gap-5 lg:grid-cols-2">
                  {projects.map((project, i) => (
                    <Reveal as="li" key={project.id} delay={(i % 2) * 0.08} className="h-full">
                      <ProjectCard project={project} />
                    </Reveal>
                  ))}
                </ul>
              )
            ) : (
              <div className="flex min-h-[26rem] flex-col items-start justify-center gap-6 rounded-[26px] border border-dashed border-line bg-surface p-10 md:flex-row md:items-center md:justify-between md:p-12">
                <div className="flex items-start gap-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-wash text-violet">
                    {isMedia ? (
                      <Clapperboard className="size-5" strokeWidth={1.9} aria-hidden />
                    ) : (
                      <Wrench className="size-5" strokeWidth={1.9} aria-hidden />
                    )}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-tight text-ink">
                      {EMPTY[tab].title}
                    </h3>
                    <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
                      {EMPTY[tab].body}
                    </p>
                  </div>
                </div>
                <Button href="/contact" variant="violet" arrow className="shrink-0">
                  Talk to us
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </section>
  );
}
