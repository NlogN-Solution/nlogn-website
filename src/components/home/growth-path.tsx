"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, Megaphone, MonitorSmartphone, Search, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { growthPath, type GrowthStep } from "@/config/growth-path";
import { cn } from "@/lib/utils";

/**
 * The approach, as one journey through five stages.
 *
 * Two renderings of the same content:
 *
 *  · Pinned — only where there is genuinely room for it (wide *and* tall
 *    enough). The panel holds the frame while scroll walks the five stages.
 *    Every measurement below is height-aware, because the previous version
 *    assumed a tall viewport and clipped its own heading and outcome text off
 *    the top and bottom of a laptop screen.
 *  · Stacked — everywhere else. No pinning, no scroll scrubbing, nothing that
 *    can clip: each stage is simply laid out in full, one after the other.
 *
 * Nothing animates layout. Stage changes are opacity/transform only, and the
 * readout bars scale rather than resize, so the whole section stays on the
 * compositor while scroll drives it.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Scroll each stage holds the frame for, in the pinned rendering. */
const STAGE_VH = 85;

/** The pinned rendering needs both the width for two columns and the height to
 *  show a stage without cropping it. Below either, the stack is the better UI. */
const PINNABLE = "(min-width: 1024px) and (min-height: 640px)";

const LENS_ICONS = [Megaphone, Search, MonitorSmartphone, Workflow] as const;

/* ── media queries, read without an effect ─────────────────────────────── */

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/* ── the stage rail ─────────────────────────────────────────────────────── */

/**
 * Five stops on one line. It reports where you are, and — because a scroll-
 * driven section with no way to skip ahead feels broken — each stop is a
 * button that scrolls to its stage.
 */
function StageRail({
  steps,
  index,
  progress,
  onSelect,
}: {
  steps: GrowthStep[];
  index: number;
  progress?: MotionValue<number>;
  onSelect?: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {steps.map((step, i) => {
        const active = i === index;
        const done = i < index;
        const Tag = onSelect ? "button" : "div";

        return (
          <li key={step.n} className="min-w-0 flex-1">
            <Tag
              {...(onSelect
                ? {
                    type: "button" as const,
                    onClick: () => onSelect(i),
                    "aria-current": active ? ("step" as const) : undefined,
                    "aria-label": `Stage ${step.n}: ${step.title}`,
                  }
                : {})}
              className={cn(
                "group block w-full text-left",
                onSelect && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "relative block h-[3px] w-full overflow-hidden rounded-full transition-colors duration-500",
                  done ? "bg-violet" : "bg-line",
                )}
              >
                {active && (
                  <motion.span
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[linear-gradient(90deg,#a78bfa,#6c47ff)]"
                    style={
                      progress
                        ? { scaleX: progress }
                        : { scaleX: 1 }
                    }
                  />
                )}
              </span>
              <span className="mt-2.5 flex items-baseline gap-2">
                <span
                  className={cn(
                    "label transition-colors duration-500",
                    active ? "text-violet" : done ? "text-violet-deep/70" : "text-muted/60",
                  )}
                >
                  {step.n}
                </span>
                <span
                  className={cn(
                    "truncate font-display text-[0.8125rem] font-semibold tracking-[-0.01em] transition-colors duration-500",
                    active ? "text-ink" : "text-muted",
                    onSelect && "group-hover:text-ink",
                  )}
                >
                  {step.title}
                </span>
              </span>
            </Tag>
          </li>
        );
      })}
    </ol>
  );
}

/* ── the system panel ───────────────────────────────────────────────────── */

/**
 * One card, five states. The four discipline rows are the same rows at every
 * stage — only their emphasis, chips and readouts change, so a stage visibly
 * becomes the next one rather than being swapped for it.
 */
function SystemPanel({ step, index, compact }: { step: GrowthStep; index: number; compact?: boolean }) {
  const mode = index; // 0 scan · 1 measure · 2 rank · 3 assemble · 4 expand

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-line bg-[linear-gradient(160deg,#ffffff,#faf8ff)] shadow-[0_1px_2px_rgba(11,11,15,0.04),0_30px_70px_-45px_rgba(56,28,150,0.4)]",
        compact
          ? "p-[clamp(1rem,2.2vh,1.5rem)]"
          : "p-6 md:p-8",
      )}
    >
      {/* status bar */}
      <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-[clamp(0.75rem,1.8vh,1.25rem)]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-violet" />
          </span>
          <span className="relative block h-4 min-w-[7rem] overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.span
                key={step.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="label absolute inset-x-0 top-0 text-violet"
              >
                {step.status}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <span className="label text-muted/60">
          {step.n} / {String(growthPath.length).padStart(2, "0")}
        </span>
      </div>

      {/* the scan, only while diagnosing */}
      <AnimatePresence>
        {mode === 0 && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: ["0%", "520%"] }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.4 },
              y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
            }}
            className="pointer-events-none absolute inset-x-0 top-20 h-14 bg-[linear-gradient(180deg,transparent,rgba(108,71,255,0.09),transparent)]"
          />
        )}
      </AnimatePresence>

      {/* the four rows — same elements the whole way through. Pinned, they sit
          two-up: the stack is taller than a laptop viewport can hold once the
          heading and the rail have taken their share. */}
      <ul
        className={cn(
          "relative mt-[clamp(0.75rem,1.8vh,1.25rem)]",
          compact
            ? "grid grid-cols-2 gap-[clamp(0.4rem,1vh,0.625rem)]"
            : "space-y-[clamp(0.4rem,1vh,0.625rem)]",
        )}
      >
        {step.lenses.map((lens, i) => {
          const Icon = LENS_ICONS[i];
          const fill = Math.min(0.97, 0.36 + i * 0.06 + mode * 0.1);

          return (
            <li
              key={lens.area}
              className={cn(
                "relative flex items-start rounded-2xl border p-[clamp(0.6rem,1.4vh,0.875rem)] transition-colors duration-500",
                compact ? "gap-2.5" : "gap-3.5",
                mode >= 3 ? "border-violet/25 bg-violet-wash/70" : "border-line-soft bg-surface",
              )}
            >
              {/* connector, drawn once the stages start linking up */}
              {!compact && mode >= 1 && i < step.lenses.length - 1 && (
                <motion.span
                  aria-hidden
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.45, ease: EASE, delay: 0.1 + i * 0.06 }}
                  className="absolute -bottom-[clamp(0.4rem,1vh,0.625rem)] left-[1.85rem] h-[clamp(0.4rem,1vh,0.625rem)] w-px origin-top bg-violet/30"
                />
              )}

              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-xl transition-colors duration-500",
                  compact ? "size-8" : "size-9",
                  mode >= 3 ? "bg-violet text-white" : "bg-violet-wash text-violet",
                )}
              >
                <Icon className={compact ? "size-[0.9rem]" : "size-4"} strokeWidth={1.9} aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span
                    className={cn(
                      "font-display font-semibold tracking-[-0.01em] text-ink",
                      compact ? "text-[0.75rem]" : "text-[0.8125rem]",
                    )}
                  >
                    {lens.area}
                  </span>
                  <span
                    className={cn(
                      "relative inline-block h-[1.05rem] align-middle",
                      compact ? "min-w-[4.5rem]" : "min-w-[5.5rem]",
                    )}
                  >
                    <AnimatePresence initial={false}>
                      <motion.span
                        key={lens.focus}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.26, ease: EASE }}
                        className="label absolute left-0 top-0 rounded-full bg-canvas-2 px-2 py-0.5 text-[0.5625rem] text-violet-deep"
                      >
                        {lens.focus}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>

                {/* Two lines' worth of room is reserved, so a shorter line on the
                    next stage never resizes the card mid-transition. */}
                <span
                  className={cn(
                    "relative mt-1 block",
                    compact
                      ? "h-[2.7rem] text-[0.6875rem] leading-[0.875rem]"
                      : "h-[2.4rem] text-[0.8125rem] leading-[1.2rem]",
                  )}
                >
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={lens.detail}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: EASE, delay: i * 0.03 }}
                      className="absolute inset-x-0 top-0 text-muted"
                    >
                      {lens.detail}
                    </motion.span>
                  </AnimatePresence>
                </span>

                {/* the readout — scaled, never resized */}
                <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-line-soft">
                  <motion.span
                    className="block h-full w-full origin-left rounded-full bg-[linear-gradient(90deg,#a78bfa,#6c47ff)]"
                    initial={false}
                    animate={{ scaleX: fill }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.06 * i }}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* The strip everything converges on. It is present at every stage — held
          back and hairlined while the parts are still separate, then filled once
          they are one system — so the card never resizes under the transition. */}
      <div
        className={cn(
          "mt-[clamp(0.5rem,1.4vh,0.875rem)] flex h-[clamp(2.75rem,6vh,3.5rem)] items-center justify-between rounded-2xl border px-5 transition-colors duration-700",
          mode >= 3
            ? "border-violet/25 bg-violet text-white"
            : "border-dashed border-line bg-canvas/60 text-muted",
        )}
      >
        <span className="relative block h-4 flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.span
              key={mode >= 3 ? (mode === 4 ? "scale" : "one") : "assembling"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="label absolute inset-x-0 top-0"
            >
              {mode >= 3 ? (mode === 4 ? "Ready to scale" : "One system") : "Assembling"}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="flex items-center gap-1.5">
          {growthPath.map((_, i) => (
            <motion.span
              key={i}
              aria-hidden
              className={cn(
                "block size-1.5 rounded-full transition-colors duration-700",
                mode >= 3 ? "bg-white/70" : i <= mode ? "bg-violet/60" : "bg-line",
              )}
              animate={
                mode === 4
                  ? { opacity: [0.3, 1, 0.3] }
                  : { opacity: mode >= 3 ? (i < 3 ? 1 : 0.3) : 1 }
              }
              transition={
                mode === 4
                  ? { duration: 1.6, repeat: Infinity, delay: i * 0.16 }
                  : { duration: 0.3 }
              }
            />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ── a stage, in words ──────────────────────────────────────────────────── */

function StageCopy({ step, compact }: { step: GrowthStep; compact?: boolean }) {
  const heading = compact
    ? "text-[clamp(1.6rem,0.9rem+1.6vw+0.6vh,2.6rem)]"
    : "text-[clamp(1.75rem,1.2rem+1.8vw,2.5rem)]";

  return (
    <div className="max-w-xl">
      <span className="label text-muted">
        {step.n} / {step.label}
      </span>

      <div className={compact ? "relative" : undefined}>
        <AnimatePresence mode="popLayout" initial={false}>
          {/* The outgoing stage leaves quickly and the incoming one waits that
              long before starting, so the two never sit legibly on top of each
              other — and because the exit is out of flow, nothing jumps. */}
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.16, ease: "easeIn" } }}
            transition={{ duration: 0.34, ease: EASE, delay: 0.16 }}
          >
            <h3
              className={cn(
                "mt-[clamp(0.75rem,2vh,1.5rem)] font-display font-extrabold leading-[1.08] tracking-[-0.04em] text-ink",
                heading,
              )}
            >
              {step.claim}
            </h3>
            <p className="mt-[clamp(0.75rem,1.8vh,1.25rem)] text-[clamp(0.9375rem,0.85rem+0.2vw,1.0625rem)] leading-relaxed text-muted">
              {step.body}
            </p>

            <div className="mt-[clamp(1rem,2.4vh,1.75rem)] flex gap-4 border-t border-line pt-[clamp(0.75rem,2vh,1.25rem)]">
              <ArrowRight className="mt-1 size-4 shrink-0 text-violet" aria-hidden />
              <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                <span className="label mr-2 text-violet">Outcome</span>
                {step.outcome}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── the section ────────────────────────────────────────────────────────── */

function Header({ compact }: { compact?: boolean }) {
  /* Pinned, the heading is one line beside the eyebrow — every pixel it takes
     comes off the stage below it. Stacked, it gets the full treatment. */
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Eyebrow>Our approach</Eyebrow>
        <h2 className="font-extrabold leading-[1.1] tracking-[-0.035em] text-ink text-[clamp(1.25rem,0.7rem+1.1vw+0.6vh,1.9rem)]">
          From a stuck number to a system that{" "}
          <span className="text-gradient-violet">compounds</span>
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Eyebrow>Our approach</Eyebrow>
      <h2 className="mt-6 text-[clamp(1.9rem,1.2rem+2.4vw,3rem)] font-extrabold leading-[1.06] text-ink">
        From a stuck number to a system that{" "}
        <span className="text-gradient-violet">compounds</span>
      </h2>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        Five stages, run in order, whatever you hired us for. Each one hands the next
        something to work with.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <div className="border-t border-line pt-8">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.9375rem] text-muted">
        <ArrowRight className="size-4 shrink-0 text-violet" aria-hidden />
        Every discipline below is run through those same five stages — which is why they
        report against one number rather than five.
      </p>
      <div className="mt-8">
        <Button href="/process" variant="secondary" arrow>
          How an engagement runs
        </Button>
      </div>
    </div>
  );
}

/** Everything laid out, nothing pinned — the rendering that cannot clip. */
function StackedPath() {
  return (
    <section id="approach" className="container-x py-16 md:py-24">
      <Header />
      <div className="mt-12 space-y-16 md:mt-16 md:space-y-24">
        {growthPath.map((step, i) => (
          <div
            key={step.n}
            className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-14"
          >
            <div>
              <span className="mb-6 block h-[3px] w-16 rounded-full bg-[linear-gradient(90deg,#a78bfa,#6c47ff)]" />
              <StageCopy step={step} />
            </div>
            <SystemPanel step={step} index={i} />
          </div>
        ))}
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </section>
  );
}

/** Pinned: the panel holds the frame while scroll walks the five stages. */
function PinnedPath() {
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const total = growthPath.length;

  /*
   * Scroll is read here rather than through `useScroll` so that one piece of
   * arithmetic drives all three consumers — the stage index, the rail's live
   * segment and the `goTo` jump — and a click on stop four therefore lands
   * exactly where stage four begins. One rAF-throttled read per frame, on a
   * passive listener; the section itself never re-renders per frame.
   */
  const progress = useMotionValue(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;

    let frame = 0;

    const read = () => {
      frame = 0;
      const travel = el.offsetHeight - window.innerHeight;
      if (travel <= 0) return;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / travel));
      progress.set(p);
      const next = Math.min(total - 1, Math.floor(p * total));
      setIndex((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [progress, total]);

  // A spring keeps the rail from twitching with the scroll wheel's steps.
  const eased = useSpring(progress, { stiffness: 130, damping: 30, mass: 0.35 });

  /** Progress within the active stage, 0 → 1, for the rail's live segment. */
  const withinStage = useTransform(eased, (v) => {
    const scaled = Math.min(total, Math.max(0, v * total));
    return Math.min(1, Math.max(0, scaled - Math.floor(Math.min(total - 0.0001, scaled))));
  });

  const goTo = (i: number) => {
    const el = section.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    // Land a third of the way into the stage, clear of both its boundaries.
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.34) / total) * travel, behavior: "smooth" });
  };

  return (
    <>
      <section
        id="approach"
        ref={section}
        aria-label="Our approach"
        className="relative"
        style={{ height: `calc(${total} * ${STAGE_VH}vh + 100svh)` }}
      >
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pb-[clamp(1.5rem,4vh,3rem)] pt-[calc(5.5rem+clamp(1rem,3vh,2.5rem))]">
          <div className="container-x flex w-full flex-col gap-[clamp(1rem,3vh,2.25rem)]">
            <Header compact />

            <StageRail
              steps={growthPath}
              index={index}
              progress={withinStage}
              onSelect={goTo}
            />

            <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] xl:gap-16">
              <StageCopy step={growthPath[index]} compact />
              <SystemPanel step={growthPath[index]} index={index} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="container-x pb-16 md:pb-24">
        <Footer />
      </section>
    </>
  );
}

export function GrowthPath() {
  const pinnable = useMediaQuery(PINNABLE);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (!pinnable || reduced) return <StackedPath />;
  return <PinnedPath />;
}
