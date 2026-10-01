"use client";

import { motion } from "motion/react";
import { nlognPath, nlognPoint } from "@/components/ui/growth-curve";
import type { GrowthVisualKey } from "@/config/growth-path";
import { cn } from "@/lib/utils";

/**
 * One visual per step of the approach. Each animates when its step reaches the
 * middle of the viewport, and each shows the actual move rather than decorating
 * it: a funnel with the leak flagged, measurements landing on a baseline, bars
 * sorting themselves by value, parts assembling, the curve running in cycles.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Props = { active: boolean; reduced: boolean };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[9rem] overflow-hidden rounded-[0.9rem] border border-line-soft bg-[linear-gradient(155deg,#fbfaff_0%,#f4f1fb_100%)]">
      {children}
    </div>
  );
}

/** Shared: play once the step is active, hold the end state for reduced motion. */
const on = (active: boolean, reduced: boolean) => (reduced ? "on" : active ? "on" : "off");

/* ── 01 Diagnose — find where the funnel actually breaks ────────────────── */

const FUNNEL = [100, 79, 62, 25, 21];
const BREAK = 3; // the stage the drop happens at

function Diagnose({ active, reduced }: Props) {
  return (
    <Frame>
      <motion.div
        initial={false}
        animate={on(active, reduced)}
        variants={{ on: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }, off: {} }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[0.5rem] px-8"
      >
        {FUNNEL.map((w, i) => (
          <motion.span
            key={w}
            variants={{
              off: { scaleX: 0.15, opacity: 0 },
              on: { scaleX: 1, opacity: 1 },
            }}
            transition={{ duration: 0.55, ease: EASE }}
            style={{ width: `${w}%` }}
            className={cn(
              "h-[0.5rem] rounded-full",
              i === BREAK ? "bg-violet" : "bg-violet/18",
            )}
          />
        ))}
      </motion.div>

      {/* the sweep that finds it */}
      {!reduced && (
        <motion.span
          aria-hidden
          initial={{ x: "-30%", opacity: 0 }}
          animate={active ? { x: "130%", opacity: [0, 1, 1, 0] } : { x: "-30%", opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          className="absolute inset-y-0 w-16 bg-[linear-gradient(90deg,transparent,rgba(108,71,255,0.10),transparent)]"
        />
      )}

      <motion.span
        initial={false}
        animate={active || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.45, ease: EASE, delay: reduced ? 0 : 0.9 }}
        className="label absolute bottom-3 right-4 rounded-full bg-violet px-2.5 py-1 text-white"
      >
        Constraint
      </motion.span>
    </Frame>
  );
}

/* ── 02 Audit — every metric gets a before ──────────────────────────────── */

const BASELINES = [64, 38, 81, 52];

function Audit({ active, reduced }: Props) {
  return (
    <Frame>
      <span aria-hidden className="absolute inset-y-5 left-[22%] w-px border-l border-dashed border-ink/15" />
      <span className="label absolute left-[22%] top-2 -translate-x-1/2 text-muted/60">Before</span>

      <motion.div
        initial={false}
        animate={on(active, reduced)}
        variants={{ on: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } }, off: {} }}
        className="absolute inset-x-6 bottom-5 top-8 flex flex-col justify-center gap-3"
      >
        {BASELINES.map((v, i) => (
          <div key={v} className="flex items-center gap-2">
            <span className="h-[0.4rem] w-[14%] rounded-full bg-line" />
            <motion.span
              variants={{ off: { scaleX: 0 }, on: { scaleX: 1 } }}
              transition={{ duration: 0.7, ease: EASE }}
              style={{ width: `${v}%`, transformOrigin: "left" }}
              className={cn("h-[0.4rem] rounded-full", i === 1 ? "bg-violet" : "bg-violet/25")}
            />
          </div>
        ))}
      </motion.div>
    </Frame>
  );
}

/* ── 03 Model — the bars sort themselves by what they are worth ─────────── */

/** Values stay unique so each bar keeps a stable layout key through the sort. */
const UNSORTED = [34, 82, 51, 96, 23, 68, 45, 59];

function Model({ active, reduced }: Props) {
  const bars = active || reduced ? [...UNSORTED].sort((a, b) => b - a) : UNSORTED;

  return (
    <Frame>
      <div className="absolute inset-x-6 bottom-8 top-6 flex items-end justify-center gap-2.5">
        {bars.map((v, i) => (
          <motion.span
            key={v}
            layout={!reduced}
            transition={{ duration: 0.65, ease: EASE, delay: reduced ? 0 : i * 0.035 }}
            style={{ height: `${v}%` }}
            className={cn(
              "w-[7%] rounded-t-[0.2rem] transition-colors duration-500",
              (active || reduced) && i < 2 ? "bg-violet" : "bg-violet/20",
            )}
          />
        ))}
      </div>
      <span className="label absolute bottom-3 left-6 text-muted/60">Ranked by value</span>
    </Frame>
  );
}

/* ── 04 Build — the parts land as one system ────────────────────────────── */

const PARTS = [
  "left-[6%] top-[14%] h-[16%] w-[88%]",
  "left-[6%] top-[38%] h-[46%] w-[22%]",
  "left-[32%] top-[38%] h-[20%] w-[30%]",
  "left-[66%] top-[38%] h-[20%] w-[28%]",
  "left-[32%] top-[64%] h-[20%] w-[62%]",
];

function Build({ active, reduced }: Props) {
  return (
    <Frame>
      <motion.div
        initial={false}
        animate={on(active, reduced)}
        variants={{ on: { transition: { staggerChildren: 0.075, delayChildren: 0.1 } }, off: {} }}
        className="absolute inset-0"
      >
        {PARTS.map((pos, i) => (
          <motion.span
            key={pos}
            variants={{
              off: { opacity: 0, y: 14, scale: 0.94 },
              on: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn(
              "absolute rounded-[0.35rem] border",
              pos,
              i === 0 ? "border-violet/25 bg-violet/15" : "border-line bg-surface",
            )}
          />
        ))}
      </motion.div>
    </Frame>
  );
}

/* ── 05 Compound — cycles run, the curve keeps climbing ─────────────────── */

const CW = 300;
const CH = 110;
const CYCLES = [0.18, 0.36, 0.54, 0.72, 0.9];

function Compound({ active, reduced }: Props) {
  const path = nlognPath(CW, CH, 64, 6);

  return (
    <Frame>
      <svg viewBox={`0 0 ${CW} ${CH}`} className="absolute inset-x-5 inset-y-6 h-[calc(100%-3rem)] w-[calc(100%-2.5rem)]" fill="none" aria-hidden>
        <defs>
          <linearGradient id="gp-compound" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4526c9" />
          </linearGradient>
        </defs>

        {CYCLES.map((t, i) => {
          const p = nlognPoint(CW, CH, t, 6);
          return (
            <motion.g key={t}>
              <line x1={p.x} y1={p.y} x2={p.x} y2={CH - 4} stroke="#0b0b0f" strokeOpacity="0.08" strokeWidth="1" />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#6c47ff"
                initial={false}
                animate={active || reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.35, ease: EASE, delay: reduced ? 0 : 0.6 + i * 0.14 }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              />
            </motion.g>
          );
        })}

        <motion.path
          d={path}
          stroke="url(#gp-compound)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={false}
          animate={active || reduced ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.3, ease: EASE, delay: reduced ? 0 : 0.1 }}
        />
      </svg>
      <span className="label absolute bottom-3 left-6 text-muted/60">Fortnightly cycles</span>
    </Frame>
  );
}

const VISUALS: Record<GrowthVisualKey, (p: Props) => React.ReactElement> = {
  diagnose: Diagnose,
  audit: Audit,
  model: Model,
  build: Build,
  compound: Compound,
};

export function GrowthVisual({
  name,
  active,
  reduced,
}: {
  name: GrowthVisualKey;
  active: boolean;
  reduced: boolean;
}) {
  const Visual = VISUALS[name];
  return <Visual active={active} reduced={reduced} />;
}
