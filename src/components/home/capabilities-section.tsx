"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { CapabilityVisual } from "@/components/home/capability-visuals";
import { capabilities, workBySlug, type Capability, type CapabilityProject } from "@/config/capabilities";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Services ───────────────────────────────────────────────────────────── */

function ServiceList({ services, columns = 4 }: { services: string[]; columns?: 2 | 4 }) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-3.5 min-[400px]:grid-cols-2 sm:gap-x-10",
        columns === 4 && "xl:grid-cols-4",
      )}
    >
      {services.map((service) => (
        <li
          key={service}
          className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-white/65"
        >
          <span aria-hidden className="mt-[0.6em] h-px w-2.5 shrink-0 bg-violet-soft/60" />
          {service}
        </li>
      ))}
    </ul>
  );
}

/** Section label above a block inside the panel. */
function PanelLabel({ children }: { children: React.ReactNode }) {
  return <p className="label text-white/35">{children}</p>;
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="label rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-white/55"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ── Proof: real engagements, per discipline ────────────────────────────── */

function ProjectVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <video
      ref={ref}
      src={src.startsWith("/") ? src : `/videos/${src}`}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      onMouseEnter={() => void ref.current?.play().catch(() => {})}
      onFocus={() => void ref.current?.play().catch(() => {})}
      onMouseLeave={() => ref.current?.pause()}
      onBlur={() => ref.current?.pause()}
      className="aspect-video w-full rounded-xl border border-white/10 object-cover"
    />
  );
}

function ProjectCard({ project }: { project: CapabilityProject }) {
  const work = workBySlug.get(project.work);
  if (!work) return null;

  return (
    <Link
      href={`/works/${work.slug}`}
      className="group flex h-full flex-col rounded-[18px] border border-white/[0.09] bg-white/[0.025] p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-violet/35 hover:bg-white/[0.05]"
    >
      {project.video && (
        <div className="mb-4">
          <ProjectVideo src={project.video} label={`${work.client} — work sample`} />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="label text-violet-soft">{work.client}</span>
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-white/25 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-soft"
        />
      </div>

      <p className="mt-4 font-display text-[1.6rem] font-extrabold leading-none tracking-[-0.045em] text-white">
        {project.metric.value}
      </p>
      <p className="mt-1.5 text-xs text-white/40">{project.metric.label}</p>

      <p className="mt-4 flex-1 text-[0.875rem] leading-relaxed text-white/55">{project.role}</p>

      <p className="label mt-5 border-t border-white/[0.07] pt-4 text-white/30">
        {work.category} · {work.year}
      </p>
    </Link>
  );
}

function ProjectRow({ capability }: { capability: Capability }) {
  return (
    <div className="mt-10 border-t border-white/10 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <PanelLabel>Proof — {capability.label.toLowerCase()} in the work</PanelLabel>
        <p className="text-xs text-white/30">Every figure comes from the client&apos;s own reporting.</p>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {capability.projects.map((project) => (
          <li key={`${capability.id}-${project.work}`}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Desktop: left rail + dynamic panel ─────────────────────────────────── */

function CapabilityNavigation({
  active,
  onPreview,
  onSelect,
  onLeave,
}: {
  active: number;
  onPreview: (i: number) => void;
  onSelect: (i: number) => void;
  onLeave: () => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      const last = capabilities.length - 1;
      const map: Record<string, number> = {
        ArrowDown: i === last ? 0 : i + 1,
        ArrowUp: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      };
      const next = map[e.key];
      if (next === undefined) return;
      e.preventDefault();
      onSelect(next);
      refs.current[next]?.focus();
    },
    [onSelect],
  );

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      aria-label="Areas of work"
      onMouseLeave={onLeave}
      className="border-t border-white/[0.07]"
    >
      {capabilities.map((capability, i) => {
        const isActive = i === active;
        return (
          <button
            key={capability.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`cap-tab-${capability.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`cap-panel-${capability.id}`}
            tabIndex={isActive ? 0 : -1}
            onMouseEnter={() => onPreview(i)}
            onFocus={() => onPreview(i)}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="group relative flex w-full items-center gap-5 border-b border-white/[0.07] py-[1.15rem] pl-5 pr-4 text-left"
          >
            {isActive && (
              <motion.span
                layoutId="capability-rail"
                aria-hidden
                className="absolute inset-0 border-l-2 border-violet bg-[linear-gradient(90deg,rgba(108,71,255,0.16),rgba(108,71,255,0)_75%)]"
                transition={{ duration: 0.4, ease: EASE }}
              />
            )}
            <span
              className={cn(
                "label relative transition-all duration-300",
                isActive ? "translate-x-0.5 text-violet-soft" : "text-white/25 group-hover:text-white/45",
              )}
            >
              {capability.number}
            </span>
            <span
              className={cn(
                "relative font-display text-[1.0625rem] font-semibold tracking-[-0.02em] transition-colors duration-300",
                isActive ? "text-white" : "text-white/45 group-hover:text-white/80",
              )}
            >
              {capability.label}
            </span>
            <ArrowRight
              aria-hidden
              className={cn(
                "relative ml-auto size-4 transition-all duration-300",
                isActive ? "translate-x-0 text-violet-soft opacity-100" : "-translate-x-2 text-white/40 opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function CapabilityPanel({ capability }: { capability: Capability }) {
  const reduced = useReducedMotion();

  const fade = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  return (
    <div
      id={`cap-panel-${capability.id}`}
      role="tabpanel"
      aria-labelledby={`cap-tab-${capability.id}`}
      tabIndex={0}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-8 xl:min-h-[47rem] xl:p-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(50%_100%_at_70%_100%,rgba(108,71,255,0.20),transparent_70%)]"
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={capability.id}
          {...fade}
          transition={{ duration: 0.42, ease: EASE }}
          className="relative"
        >
          <div className="flex items-center gap-4">
            <span className="label text-violet-soft">{capability.number}</span>
            <span aria-hidden className="h-px w-8 bg-white/15" />
            <span className="label text-white/45">{capability.kicker}</span>
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.02fr_1fr] lg:items-center xl:gap-14">
            <div>
              <h3 className="text-[clamp(1.6rem,1.15rem+1.5vw,2.4rem)] font-extrabold leading-[1.08] text-white">
                {capability.title}
              </h3>
              <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/60">
                {capability.description}
              </p>
              <div className="mt-7">
                <Highlights items={capability.highlights} />
              </div>
            </div>

            <CapabilityVisual name={capability.visual} />
          </div>

          <div className="mt-10 border-t border-white/10 pt-7">
            <PanelLabel>What that includes</PanelLabel>
            <div className="mt-5">
              <ServiceList services={capability.services} />
            </div>
          </div>

          <ProjectRow capability={capability} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Mobile: single-open accordion ──────────────────────────────────────── */

function CapabilityAccordion() {
  const [open, setOpen] = useState<string | null>(capabilities[0].id);

  return (
    <div className="border-t border-white/[0.07] lg:hidden">
      {capabilities.map((capability) => {
        const isOpen = open === capability.id;
        return (
          <div key={capability.id} className="border-b border-white/[0.07]">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`cap-acc-${capability.id}`}
                onClick={() => setOpen(isOpen ? null : capability.id)}
                className={cn(
                  "flex w-full items-center gap-4 py-5 pl-4 pr-1 text-left transition-colors duration-300",
                  isOpen && "bg-[linear-gradient(90deg,rgba(108,71,255,0.14),rgba(108,71,255,0)_80%)]",
                )}
              >
                <span className={cn("label", isOpen ? "text-violet-soft" : "text-white/25")}>
                  {capability.number}
                </span>
                <span
                  className={cn(
                    "font-display text-[1.0625rem] font-semibold tracking-[-0.02em]",
                    isOpen ? "text-white" : "text-white/60",
                  )}
                >
                  {capability.label}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "ml-auto grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-300",
                    isOpen
                      ? "rotate-45 border-violet bg-violet text-white"
                      : "border-white/15 text-white/50",
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>

            {/* grid-rows keeps the copy in the DOM when collapsed, so it stays
                crawlable and there is nothing to measure on open. */}
            <div
              id={`cap-acc-${capability.id}`}
              className={cn(
                "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "px-4 pb-9 pt-1 transition-opacity duration-300",
                    isOpen ? "opacity-100 delay-100" : "opacity-0",
                  )}
                >
                  <h4 className="text-[1.45rem] font-extrabold leading-[1.12] text-white">
                    {capability.title}
                  </h4>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/60">
                    {capability.description}
                  </p>

                  <div className="mt-6">
                    <Highlights items={capability.highlights} />
                  </div>

                  {isOpen && (
                    <div className="mt-7">
                      <CapabilityVisual name={capability.visual} />
                    </div>
                  )}

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <PanelLabel>What that includes</PanelLabel>
                    <div className="mt-5">
                      <ServiceList services={capability.services} columns={2} />
                    </div>
                  </div>

                  <ProjectRow capability={capability} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Footer CTA ─────────────────────────────────────────────────────────── */

function CapabilityCta() {
  return (
    <div className="mt-16 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(150deg,rgba(108,71,255,0.16),rgba(255,255,255,0.02)_55%)] px-7 py-12 md:px-12 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.25fr_auto] lg:items-end">
        <div>
          <p className="label text-violet-soft">Not sure what your business needs?</p>
          <p className="mt-5 max-w-xl text-[clamp(1.75rem,1.2rem+1.9vw,2.75rem)] font-display font-extrabold leading-[1.06] tracking-[-0.035em] text-white">
            Let&apos;s figure it out.
          </p>
          <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-white/60">
            Tell us where you are today. We&apos;ll identify the opportunities, recommend the right
            systems and show you what we&apos;d build.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button href="/contact" variant="violet" size="lg" arrow>
            Start a project
          </Button>
          <Button
            href={`mailto:${siteConfig.email}`}
            variant="secondary"
            size="lg"
            className="border-white/15 bg-white/[0.06] text-white shadow-none hover:border-white/35 hover:bg-white/10 hover:shadow-none"
          >
            Talk to us
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────────────────── */

export function CapabilitiesSection({ withHeading = true }: { withHeading?: boolean }) {
  const [locked, setLocked] = useState(0);
  const [active, setActive] = useState(0);

  const select = useCallback((i: number) => {
    setLocked(i);
    setActive(i);
  }, []);

  // No overflow-hidden on the section: it would make it a scroll container
  // and stop the left rail from sticking.
  return (
    <section id="capabilities" className="relative bg-ink py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(70%_60%_at_18%_0%,rgba(108,71,255,0.30),transparent_60%)]"
      />

      <div className="container-x relative">
        {withHeading && (
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow className="border-white/15 bg-white/[0.06] [&_span]:text-white/70">
                What we do
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-7 text-[clamp(2rem,1.2rem+2.6vw,3.25rem)] font-extrabold leading-[1.06] text-white">
                Everything your business needs to{" "}
                <span className="text-gradient-violet">grow digitally.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-white/60">
                From content and campaigns to websites, software and automation — we build the
                digital systems that help businesses attract, convert and operate better.
              </p>
            </Reveal>
          </div>
        )}

        {/* Desktop: rail + panel */}
        <div className="mt-14 hidden gap-10 lg:grid lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <CapabilityNavigation
              active={active}
              onPreview={setActive}
              onSelect={select}
              onLeave={() => setActive(locked)}
            />
            <p className="label mt-6 pl-5 text-white/25">Hover to preview · click to hold</p>
          </div>
          <CapabilityPanel capability={capabilities[active]} />
        </div>

        {/* Mobile and tablet: accordion */}
        <div className="mt-12 lg:hidden">
          <CapabilityAccordion />
        </div>

        <CapabilityCta />
      </div>
    </section>
  );
}
