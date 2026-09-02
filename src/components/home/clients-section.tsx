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
import { softwareProducts, productsByReadiness } from "@/config/software";
import { SoftwareCard } from "@/components/home/software-card";
import { cn } from "@/lib/utils";

/**
 * Recent work, split by category — films, software products, and websites.
 *
 * Nothing here is hardcoded: films and sites render from `config/clients.ts`,
 * products from `config/software.ts`. Videos stream from Cloudinary and only
 * mount a <video> once played, so opening the page never pulls four files down.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── a project ──────────────────────────────────────────────────────────── */

function ProjectCard({ project }: { project: ClientProject }) {
  const host = project.projectUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const body = (
    <>
      {/* browser chrome, so the shot reads as a live site rather than an image */}
      <div className="flex min-w-0 items-center gap-2 border-b border-line bg-canvas px-4 py-3.5 sm:px-5">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-line" />
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-line" />
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-line" />
        {host && (
          <span className="ml-3 min-w-0 truncate rounded-full bg-surface px-3 py-1 font-mono text-[0.6875rem] text-muted">
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
    "group flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";

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

/* ── films ──────────────────────────────────────────────────────────────── */

/**
 * The player. A Cloudinary still stands in until someone presses play, at which
 * point the real <video> mounts — so four films on one tab cost four images,
 * not four downloads.
 */
function VideoStage({ video, className }: { video: ClientVideo; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const poster = video.videoPoster ?? cloudinaryPoster(video.videoUrl);

  return (
    <div className={cn("relative overflow-hidden bg-ink", className)}>
      {playing ? (
        <video
          src={cloudinaryVideo(video.videoUrl)}
          poster={poster}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
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
              className="size-full object-cover opacity-90 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
          )}
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,15,0.15),rgba(11,11,15,0.45))]"
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-lift transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          >
            <Play className="size-6 translate-x-0.5 fill-ink" />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * A widescreen film, given the full width of the panel with its credits set
 * beside it rather than beneath. Mixing a 16:9 frame into a grid of 9:16 reels
 * leaves a hole in the row, so the wide cut leads instead.
 */
function FeatureFilmCard({ video }: { video: ClientVideo }) {
  return (
    <figure className="group grid overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-violet/30 hover:shadow-lift lg:grid-cols-[1.6fr_1fr]">
      <VideoStage video={video} className="aspect-video" />

      <figcaption className="flex flex-col justify-center p-7 md:p-10">
        <span className="label w-fit rounded-full bg-violet-wash px-3 py-1.5 text-violet-deep">
          Featured film
        </span>
        <p className="label mt-6 text-violet">{video.sector}</p>
        <h4 className="mt-3 font-display text-[clamp(1.4rem,1.1rem+1vw,1.9rem)] font-bold tracking-[-0.03em] text-ink">
          {video.clientName}
        </h4>
        <p className="mt-1.5 text-[1.0625rem] font-medium text-violet-deep">{video.projectName}</p>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">{video.description}</p>
      </figcaption>
    </figure>
  );
}

/** A vertical reel. Sits in a row with the others, all the same shape. */
function ReelCard({ video }: { video: ClientVideo }) {
  return (
    <figure className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift">
      <VideoStage video={video} className="aspect-[9/16]" />

      <figcaption className="flex flex-1 flex-col p-6 md:p-7">
        <p className="label text-violet">{video.sector}</p>
        <h4 className="mt-3 font-display text-lg font-bold tracking-[-0.03em] text-ink">
          {video.clientName}
        </h4>
        <p className="mt-1 text-[0.9375rem] font-medium text-violet-deep">{video.projectName}</p>
        <p className="mt-3 flex-1 text-[0.875rem] leading-relaxed text-muted">{video.description}</p>
      </figcaption>
    </figure>
  );
}

/**
 * The media tab: wide films first as full-width features, then the vertical
 * reels in one aligned row. Shape decides placement, not the order in config,
 * so adding a film never leaves a ragged grid behind.
 */
function MediaPanel({ videos }: { videos: ClientVideo[] }) {
  const features = videos.filter((v) => v.aspect === "landscape");
  const reels = videos.filter((v) => v.aspect === "portrait");

  return (
    <div className="space-y-5">
      {features.map((video, i) => (
        <Reveal key={video.id} delay={i * 0.08}>
          <FeatureFilmCard video={video} />
        </Reveal>
      ))}

      {reels.length > 0 && (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reels.map((video, i) => (
            <Reveal as="li" key={video.id} delay={(i % 3) * 0.07} className="h-full">
              <ReelCard video={video} />
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
    body: "Most of what we build here runs behind a login, so the detail goes into a write-up rather than a public link. Ask and we will walk you through one.",
  },
};

/* ── the section ────────────────────────────────────────────────────────── */

export function ClientsSection() {
  const [tab, setTab] = useState<ClientCategory>("media");

  const isMedia = tab === "media";
  const videos = isMedia ? publishedVideos() : [];
  const products = tab === "software" ? productsByReadiness() : [];
  const projects = tab === "websites" ? projectsByCategory(tab) : [];
  const count = videos.length + products.length + projects.length;

  return (
    <section id="clients" className="container-x py-16 md:py-28">
      <SectionHeading
        eyebrow="Recent clients"
        title={
          <>
            Clients and Projects <span className="text-gradient-violet">we have worked with</span>
          </>
        }
        lead="Films, software products and websites — client work running in production, and the platforms we build and run ourselves."
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
              item.id === "media"
                ? publishedVideos().length
                : item.id === "software"
                  ? softwareProducts.length
                  : projectsByCategory(item.id).length;
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
            {count === 0 ? null : isMedia ? (
              <MediaPanel videos={videos} />
            ) : (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
                {products.map((product, i) => (
                  <Reveal as="li" key={product.slug} delay={(i % 2) * 0.08} className="h-full">
                    <SoftwareCard product={product} />
                  </Reveal>
                ))}
                {projects.map((project, i) => (
                  <Reveal as="li" key={project.id} delay={(i % 2) * 0.08} className="h-full">
                    <ProjectCard project={project} />
                  </Reveal>
                ))}
              </ul>
            )}
            {count === 0 && (
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
