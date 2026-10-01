"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Activity, Box, TrendingUp, Users } from "lucide-react";
import { stats } from "@/config/site";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const icons = {
  box: Box,
  trend: TrendingUp,
  pulse: Activity,
  users: Users,
} as const;

/* ── the figure, counted up ─────────────────────────────────────────────── */

/** Splits "4.8×" into its prefix, number and suffix so only the number moves. */
function parse(value: string) {
  const match = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return {
    prefix,
    suffix,
    target: Number.parseFloat(digits),
    decimals: (digits.split(".")[1] ?? "").length,
  };
}

function CountUp({ value, play }: { value: string; play: boolean }) {
  const parsed = useMemo(() => parse(value), [value]);
  const reduced = useReducedMotion();

  // Server-render the real figure so it is in the HTML for crawlers and for
  // anyone without scripting; only drop to zero once we know the band is still
  // off screen, which keeps the reset from ever being visible.
  const [n, setN] = useState(parsed?.target ?? 0);
  const armed = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (reduced || play || armed.current || !parsed) return;
    armed.current = true;
    setN(0);
  }, [reduced, play, parsed]);

  useEffect(() => {
    if (reduced || !play || started.current || !parsed || !armed.current) return;
    started.current = true;

    const duration = 1200;
    const from = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - from) / duration);
      setN(parsed.target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [play, reduced, parsed]);

  if (!parsed) return <>{value}</>;
  return (
    <>
      {parsed.prefix}
      {n.toFixed(parsed.decimals)}
      {parsed.suffix}
    </>
  );
}

/* ── the sparkline beside it ────────────────────────────────────────────── */

function Spark({ data, play }: { data: readonly number[]; play: boolean }) {
  return (
    <span aria-hidden className="flex h-8 items-end gap-[0.1875rem]">
      {data.map((h, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ scaleY: play ? 1 : 0 }}
          transition={{ duration: 0.55, delay: 0.2 + i * 0.07, ease: EASE }}
          style={{ height: `${h}%`, transformOrigin: "bottom" }}
          className="w-[0.1875rem] rounded-full bg-violet/25 transition-colors duration-500 group-hover:bg-violet/50"
        />
      ))}
    </span>
  );
}

/* ── the band ───────────────────────────────────────────────────────────── */

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const play = reduced || inView;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[1.75rem] border border-line bg-[linear-gradient(163deg,#ffffff_0%,#fbf9fe_52%,#f5f2fc_100%)] shadow-[0_1px_2px_rgba(11,11,15,0.03),0_28px_64px_-38px_rgba(56,28,150,0.32)]"
    >
      {/* a bloom under the first cell, so the band is lit rather than flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[8%] -top-[70%] h-[190%] w-[46%] rounded-full bg-[radial-gradient(closest-side,rgba(124,92,255,0.13),transparent)]"
      />

      <div className="relative grid sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = icons[stat.icon];
          return (
            <div
              key={stat.label}
              className="group relative px-7 py-8 transition-colors duration-500 hover:bg-white/70 md:px-8 md:py-9"
            >
              {/* dividers fade out at their ends rather than butting into corners */}
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-x-7 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-line),transparent)] sm:hidden"
                />
              )}
              {i >= 2 && (
                <span
                  aria-hidden
                  className="absolute inset-x-7 top-0 hidden h-px bg-[linear-gradient(90deg,transparent,var(--color-line),transparent)] sm:block lg:hidden"
                />
              )}
              {i % 2 === 1 && (
                <span
                  aria-hidden
                  className="absolute inset-y-7 left-0 hidden w-px bg-[linear-gradient(180deg,transparent,var(--color-line),transparent)] sm:block lg:hidden"
                />
              )}
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-y-7 left-0 hidden w-px bg-[linear-gradient(180deg,transparent,var(--color-line),transparent)] lg:block"
                />
              )}

              {/* the accent that draws in on hover */}
              <span
                aria-hidden
                className="absolute inset-x-7 top-0 h-[2px] origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,#a78bfa,#6c47ff)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
              />

              <div className="flex items-start justify-between gap-4">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-[0.85rem] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "bg-violet-wash text-violet group-hover:-translate-y-0.5 group-hover:bg-violet group-hover:text-white group-hover:shadow-[0_10px_22px_-10px_rgba(108,71,255,0.85)]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.9} aria-hidden />
                </span>
                <Spark data={stat.spark} play={play} />
              </div>

              <p className="mt-7 font-display text-[clamp(2.15rem,1.5rem+1.9vw,2.9rem)] font-semibold leading-none tracking-[-0.05em] text-ink tabular-nums">
                <CountUp value={stat.value} play={play} />
              </p>

              <p className="mt-4 text-[1.0625rem] font-medium leading-tight text-ink">
                {stat.label}
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{stat.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
