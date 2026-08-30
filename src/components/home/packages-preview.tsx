"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { familyIcons } from "@/components/packages/icons";
import { packageFamilies, type PackageFamily } from "@/config/packages";
import { cn } from "@/lib/utils";

/**
 * The services deck.
 *
 * The section is tall and its inner panel is pinned, so one card holds the frame
 * at a time and scrolling deals the next one in. Every transform is driven
 * straight off a scroll MotionValue — React re-renders only when the active
 * index changes, six times across the whole section, never per frame.
 */

/**
 * Scroll each card holds the frame for. Kept short: a long slice reads as lag,
 * because you scroll and nothing appears to happen.
 */
const HOLD_VH = 32;

const FEATURED = [
  "digital-marketing",
  "seo",
  "websites",
  "software",
  "ai-automation",
  "ai-chatbots",
];

/**
 * The supplied artwork is stock illustration in six unrelated styles, so it is
 * desaturated and multiplied into the lavender panel rather than dropped in at
 * full colour. It returns to colour on hover.
 */
const ART: Record<string, string> = {
  "digital-marketing": "/services/digital-marketing.webp",
  seo: "/services/seo.webp",
  websites: "/services/web-development.webp",
  software: "/services/it-solutions.webp",
  "ai-automation": "/services/ai-automation.webp",
  "ai-chatbots": "/services/ai-chatbots-agents.webp",
};

/**
 * Read the media query directly rather than flipping state in an effect: the
 * server snapshot is `false`, so the pinned deck renders, and a client that
 * prefers reduced motion swaps to the static grid on its first paint.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/* ── the card ───────────────────────────────────────────────────────────── */

function Card({ family }: { family: PackageFamily }) {
  const Icon = familyIcons[family.icon];
  const art = ART[family.slug];

  return (
    <Link
      href={`/services#${family.slug}`}
      tabIndex={-1}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-canvas transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-violet/30 hover:bg-surface"
    >
      <div className="relative h-36 shrink-0 overflow-hidden border-b border-line-soft bg-[linear-gradient(160deg,#f6f2ff,#ece5fb)] sm:h-44">
        {art && (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 1024px) 90vw, 28rem"
            className="object-contain p-5 grayscale-[0.45] transition-[filter,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        )}
        <span className="label absolute right-6 top-5 text-muted">{family.n}</span>
      </div>

      <div className="relative flex flex-1 flex-col p-7 sm:p-8">
        <span className="absolute -top-7 left-7 grid size-14 place-items-center rounded-2xl border border-line bg-surface text-violet shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:bg-violet group-hover:text-white sm:left-8">
          <Icon className="size-6" strokeWidth={1.85} />
        </span>

        <p className="label mt-7 text-violet-deep">{family.system}</p>
        <h3 className="mt-2.5 font-display text-[1.55rem] font-bold leading-tight tracking-[-0.03em] text-ink">
          {family.name}
        </h3>
        <p className="mt-3.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{family.intro}</p>

        <div className="mt-6 flex items-end justify-between border-t border-line-soft pt-5">
          <span>
            <span className="block text-xs text-muted">{family.model}</span>
            <span className="font-display text-lg font-bold text-ink">From {family.from}</span>
          </span>
          <ArrowUpRight className="size-5 text-muted transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-violet" />
        </div>
      </div>
    </Link>
  );
}

/* ── one card's slice of the scroll ─────────────────────────────────────── */

function DeckCard({
  family,
  index,
  total,
  progress,
}: {
  family: PackageFamily;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const step = 1 / total;
  const start = index * step;

  // Every card uses the identical curve — no first/last special cases, which is
  // what broke card one: a zero-width [0, 0.0001] segment poisoned its range.
  // The parent instead hands over a progress value already inset by half a
  // slice, so the first and last cards sit settled at the two extremes.
  const keys = [
    start - step * 0.34,
    start + step * 0.02,
    start + step * 0.64,
    start + step,
  ];

  const opacity = useTransform(progress, keys, [0, 1, 1, 0]);
  // The middle pair are not identical: the card keeps drifting a few pixels
  // while it holds, so every scroll produces visible movement.
  const x = useTransform(progress, keys, [88, 6, -6, -78]);
  const y = useTransform(progress, keys, [24, 2, -2, -18]);
  const scale = useTransform(progress, keys, [0.93, 0.995, 1, 0.955]);
  const rotate = useTransform(progress, keys, [2, 0.2, -0.2, -1.6]);

  // Derived from the value, not from state, so a card never re-renders on scroll.
  const pointerEvents = useTransform(opacity, (o) => (o > 0.85 ? "auto" : "none"));

  return (
    <motion.div
      style={{ opacity, x, y, scale, rotate, zIndex: index, pointerEvents }}
      className="absolute inset-0"
    >
      <Card family={family} />
    </motion.div>
  );
}

/**
 * The counter and dots keep the only piece of scroll-driven state, isolated in
 * their own component so re-rendering them never touches the cards.
 */
function DeckStatus({
  progress,
  bar,
  total,
}: {
  /** Inset deck position, for the index. */
  progress: MotionValue<number>;
  /** Raw section progress, so the bar still runs empty to full. */
  bar: MotionValue<number>;
  total: number;
}) {
  const [index, setIndex] = useState(0);

  useMotionValueEvent(progress, "change", (v) => {
    const next = Math.min(total - 1, Math.max(0, Math.floor(v * total)));
    setIndex((prev) => (prev === next ? prev : next));
  });

  return (
    <>
      <div className="mt-8 flex items-baseline gap-3">
        <span className="font-display text-[2.4rem] font-extrabold leading-none tracking-[-0.05em] text-ink tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-base font-medium text-muted">
          / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-4 h-px w-full max-w-xs bg-line">
        <motion.div
          style={{ scaleX: bar }}
          className="h-px w-full origin-left bg-[linear-gradient(90deg,#a78bfa,#6c47ff)]"
        />
      </div>

      <ul className="mt-5 flex items-center gap-2" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              i === index ? "w-7 bg-violet" : "w-3 bg-line",
            )}
          />
        ))}
      </ul>
    </>
  );
}

/* ── the section ────────────────────────────────────────────────────────── */

export function PackagesPreview() {
  const section = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const families = packageFamilies.filter((f) => FEATURED.includes(f.slug));
  const total = families.length;

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  });

  // Half a slice of head and tail room, so card one is already settled when the
  // panel pins and the last one is still settled when it releases.
  const inset = 0.5 / total;
  const deck = useTransform(scrollYProgress, [0, 1], [inset, 1 - inset]);

  const cta = (
    <div className="flex flex-col items-start gap-6 rounded-[24px] border border-violet/20 bg-violet-wash p-8 md:flex-row md:items-center md:justify-between md:p-10">
      <div>
        <h3 className="font-display text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-extrabold tracking-tight text-ink">
          Not sure which one you need?
        </h3>
        <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
          Answer three questions and we will put a stack together around your goal — without
          picking a service first.
        </p>
      </div>
      <Button href="/services#growth-stack" variant="violet" arrow className="shrink-0">
        Build my plan
      </Button>
    </div>
  );

  // Reduced motion: same content, no pinning and nothing scrubbed.
  if (reduced) {
    return (
      <section id="services-offered" className="border-y border-line bg-surface py-16 md:py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow="Services we offer"
            title={
              <>
                Systems you can buy,{" "}
                <span className="text-gradient-violet">not hours you rent</span>
              </>
            }
            lead="Every service is a system with an outcome attached. Take one, or combine them into a growth stack built around your business."
            action={
              <Button href="/services#packages" variant="secondary" arrow>
                Compare all services
              </Button>
            }
          />
          <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <li key={family.slug} className="min-h-[30rem]">
                <Card family={family} />
              </li>
            ))}
          </ul>
          <div className="mt-12">{cta}</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        ref={section}
        id="services-offered"
        className="relative border-t border-line bg-surface"
        style={{ height: `calc(${total} * ${HOLD_VH}vh + 100vh)` }}
      >
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="container-x grid w-full items-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
            {/* the part that stays */}
            <div className="max-w-xl">
              <Eyebrow>Services we offer</Eyebrow>
              <h2 className="mt-6 text-[clamp(1.85rem,1.2rem+2.1vw,2.85rem)] font-extrabold leading-[1.08] text-ink">
                Systems you can buy,{" "}
                <span className="text-gradient-violet">not hours you rent</span>
              </h2>
              <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-muted">
                Every service is a system with an outcome attached. Take one, or combine them
                into a growth stack built around your business.
              </p>

              <DeckStatus progress={deck} bar={scrollYProgress} total={total} />

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button href="/services#packages" variant="secondary" arrow>
                  Compare all services
                </Button>
                <span className="label hidden text-muted/60 lg:inline">Scroll for the next</span>
              </div>
            </div>

            {/* the part that changes — presentational, mirrored below for AT */}
            <div aria-hidden className="relative h-[26rem] w-full sm:h-[29rem] lg:h-[33rem]">
              {families.map((family, i) => (
                <DeckCard
                  key={family.slug}
                  family={family}
                  index={i}
                  total={total}
                  progress={deck}
                />
              ))}
            </div>

            <ul className="sr-only">
              {families.map((family) => (
                <li key={family.slug}>
                  <Link href={`/services#${family.slug}`}>
                    {family.name} — {family.system}. {family.intro} {family.model}, from{" "}
                    {family.from}.
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface pb-16 pt-4 md:pb-24">
        <div className="container-x">
          <Reveal>{cta}</Reveal>
        </div>
      </section>
    </>
  );
}
