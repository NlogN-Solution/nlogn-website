"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CapabilityVisualKey } from "@/config/capabilities";

/**
 * Abstract UI visuals — one per capability. Everything is SVG on the existing
 * violet ramp: no stock imagery, no colour outside the design tokens.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Shared entrance for the one accent element in each visual. */
const pop = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.55, delay: 0.18, ease: EASE },
};

const line = (delay = 0) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 0.9, delay, ease: EASE },
});

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 250"
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ── 01 Social — a feed composition ─────────────────────────────────────── */

function SocialVisual() {
  return (
    <Svg>
      <g className="stroke-white/10" strokeWidth="1">
        <rect x="26" y="30" width="188" height="190" rx="16" className="fill-white/[0.045]" />
        <circle cx="52" cy="56" r="11" className="fill-violet/25 stroke-violet-soft/45" />
        <rect x="72" y="50" width="64" height="5" rx="2.5" className="fill-white/30 stroke-none" />
        <rect x="72" y="61" width="40" height="4" rx="2" className="fill-white/12 stroke-none" />
        <rect x="42" y="82" width="156" height="88" rx="10" className="fill-violet/12 stroke-violet/25" />
        <rect x="42" y="182" width="120" height="5" rx="2.5" className="fill-white/20 stroke-none" />
        <rect x="42" y="196" width="76" height="5" rx="2.5" className="fill-white/10 stroke-none" />

        <rect x="232" y="48" width="142" height="72" rx="14" className="fill-white/[0.035]" />
        <circle cx="254" cy="70" r="8" className="fill-white/15 stroke-none" />
        <rect x="270" y="66" width="52" height="4" rx="2" className="fill-white/22 stroke-none" />
        <rect x="248" y="90" width="110" height="4" rx="2" className="fill-white/10 stroke-none" />
        <rect x="248" y="101" width="72" height="4" rx="2" className="fill-white/10 stroke-none" />

        <rect x="232" y="136" width="142" height="84" rx="14" className="fill-white/[0.035]" />
        <rect x="248" y="154" width="110" height="4" rx="2" className="fill-white/18 stroke-none" />
        <rect x="248" y="166" width="84" height="4" rx="2" className="fill-white/10 stroke-none" />
        <rect x="248" y="188" width="42" height="16" rx="8" className="fill-violet/20 stroke-violet/30" />
      </g>

      {/* engagement counter, the one live element */}
      <motion.g {...pop}>
        <rect x="120" y="140" width="76" height="26" rx="13" className="fill-violet stroke-none" />
        <path
          d="M136 153.6c0-2.3 1.9-4.1 4.2-4.1 1.3 0 2.5.6 3.2 1.6.7-1 1.9-1.6 3.2-1.6 2.3 0 4.2 1.8 4.2 4.1 0 4.4-7.4 8.4-7.4 8.4s-7.4-4-7.4-8.4Z"
          className="fill-white"
        />
        <text x="158" y="158" className="fill-white font-mono" fontSize="10" letterSpacing="0.04em">
          +18%
        </text>
      </motion.g>
    </Svg>
  );
}

/* ── 02 Creative — video frame over an edit timeline ────────────────────── */

function CreativeVisual() {
  const reduced = useReducedMotion();
  return (
    <Svg>
      <g className="stroke-white/10" strokeWidth="1">
        <rect x="30" y="26" width="340" height="140" rx="14" className="fill-white/[0.04]" />
        <rect x="30" y="26" width="340" height="140" rx="14" className="fill-violet/10 stroke-none" />
      </g>

      <motion.g {...pop}>
        <circle cx="200" cy="96" r="26" className="fill-white" />
        <path d="M194 87.5 L212 96 L194 104.5 Z" className="fill-ink" />
      </motion.g>

      {/* timeline */}
      <g className="stroke-white/12" strokeWidth="1">
        <line x1="30" y1="186" x2="370" y2="186" />
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1={34 + i * 19} y1="180" x2={34 + i * 19} y2={i % 3 === 0 ? 174 : 178} />
        ))}
        <rect x="30" y="196" width="96" height="22" rx="6" className="fill-violet/30 stroke-violet/40" />
        <rect x="134" y="196" width="140" height="22" rx="6" className="fill-white/[0.07]" />
        <rect x="282" y="196" width="88" height="22" rx="6" className="fill-white/[0.07]" />
      </g>

      {/* playhead */}
      <motion.g
        initial={{ x: 0 }}
        animate={reduced ? { x: 0 } : { x: 250 }}
        transition={
          reduced
            ? undefined
            : { duration: 6.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }
      >
        <line x1="82" y1="170" x2="82" y2="224" className="stroke-violet-soft" strokeWidth="1.5" />
        <circle cx="82" cy="170" r="4" className="fill-violet-soft" />
      </motion.g>
    </Svg>
  );
}

/* ── 03 SEO — result rows and a ranking climb ───────────────────────────── */

function SeoVisual() {
  return (
    <Svg>
      <g className="stroke-white/10" strokeWidth="1">
        <rect x="28" y="28" width="200" height="30" rx="15" className="fill-white/[0.05]" />
        <circle cx="48" cy="43" r="6" className="stroke-white/30" fill="none" strokeWidth="1.4" />
        <line x1="52.5" y1="47.5" x2="57" y2="52" className="stroke-white/30" strokeWidth="1.4" />
        <rect x="66" y="40" width="94" height="5" rx="2.5" className="fill-white/25 stroke-none" />
      </g>

      {[0, 1, 2, 3].map((i) => {
        const y = 78 + i * 40;
        const first = i === 0;
        return (
          <g key={i}>
            <rect
              x="28"
              y={y}
              width="200"
              height="30"
              rx="8"
              className={first ? "fill-violet/14 stroke-violet/30" : "fill-white/[0.03] stroke-white/[0.07]"}
              strokeWidth="1"
            />
            <rect
              x="42"
              y={y + 9}
              width={first ? 104 : 82 - i * 8}
              height="5"
              rx="2.5"
              className={first ? "fill-violet-soft/80" : "fill-white/18"}
            />
            <rect x="42" y={y + 19} width={first ? 140 : 118 - i * 10} height="3.5" rx="1.75" className="fill-white/10" />
          </g>
        );
      })}

      <motion.g {...pop}>
        <rect x="182" y="82" width="34" height="20" rx="10" className="fill-violet" />
        <text x="199" y="96" textAnchor="middle" className="fill-white font-mono" fontSize="10">
          #1
        </text>
      </motion.g>

      {/* ranking climb */}
      <g>
        <rect x="252" y="70" width="122" height="148" rx="14" className="fill-white/[0.035] stroke-white/[0.08]" strokeWidth="1" />
        {[0, 1, 2].map((i) => (
          <line key={i} x1="266" y1={110 + i * 32} x2="360" y2={110 + i * 32} className="stroke-white/[0.07]" strokeWidth="1" />
        ))}
        <motion.path
          d="M266 194 L288 178 L310 182 L332 146 L358 104"
          fill="none"
          className="stroke-violet-soft"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...line(0.25)}
        />
        <motion.circle cx="358" cy="104" r="4.5" className="fill-violet-soft" {...pop} />
      </g>
    </Svg>
  );
}

/* ── 04 Paid — campaign performance board ───────────────────────────────── */

function PaidVisual() {
  const bars = [34, 46, 40, 62, 56, 82, 96];
  return (
    <Svg>
      <g className="stroke-white/[0.08]" strokeWidth="1">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={28 + i * 116} y="28" width="100" height="52" rx="12" className="fill-white/[0.04]" />
        ))}
      </g>
      <text x="44" y="52" className="fill-white/35 font-mono" fontSize="8" letterSpacing="0.14em">
        SPEND
      </text>
      <text x="160" y="52" className="fill-white/35 font-mono" fontSize="8" letterSpacing="0.14em">
        CPA
      </text>
      <text x="276" y="52" className="fill-white/35 font-mono" fontSize="8" letterSpacing="0.14em">
        ROAS
      </text>
      <rect x="44" y="60" width="42" height="7" rx="3.5" className="fill-white/25" />
      <rect x="160" y="60" width="34" height="7" rx="3.5" className="fill-white/25" />
      <motion.rect x="276" y="60" width="46" height="7" rx="3.5" className="fill-violet-soft" {...pop} />

      <rect x="28" y="96" width="344" height="126" rx="14" className="fill-white/[0.03] stroke-white/[0.08]" strokeWidth="1" />
      {bars.map((h, i) => (
        <motion.rect
          key={i}
          x={52 + i * 44}
          y={200 - h}
          width="22"
          height={h}
          rx="5"
          className={i >= 5 ? "fill-violet" : "fill-white/12"}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.55, delay: 0.1 + i * 0.05, ease: EASE }}
          style={{ transformOrigin: "50% 100%" }}
        />
      ))}
      <line x1="44" y1="200" x2="356" y2="200" className="stroke-white/12" strokeWidth="1" />
      <motion.path
        d="M63 172 L107 158 L151 164 L195 138 L239 146 L283 122 L327 108"
        fill="none"
        className="stroke-violet-soft/70"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
      />
    </Svg>
  );
}

/* ── 05 Web — a browser window ──────────────────────────────────────────── */

function WebVisual() {
  return (
    <Svg>
      <rect x="26" y="24" width="348" height="202" rx="16" className="fill-white/[0.045] stroke-white/10" strokeWidth="1" />
      <line x1="26" y1="58" x2="374" y2="58" className="stroke-white/10" strokeWidth="1" />
      <circle cx="48" cy="41" r="4" className="fill-white/18" />
      <circle cx="62" cy="41" r="4" className="fill-white/18" />
      <circle cx="76" cy="41" r="4" className="fill-white/18" />
      <rect x="96" y="33" width="160" height="16" rx="8" className="fill-white/[0.07]" />
      <text x="108" y="45" className="fill-white/30 font-mono" fontSize="8" letterSpacing="0.06em">
        yourbrand.com
      </text>

      <rect x="46" y="76" width="46" height="6" rx="3" className="fill-violet-soft/70" />
      <g className="fill-white/12">
        <rect x="212" y="77" width="30" height="4" rx="2" />
        <rect x="252" y="77" width="30" height="4" rx="2" />
        <rect x="292" y="77" width="30" height="4" rx="2" />
      </g>
      <motion.rect x="332" y="72" width="24" height="14" rx="7" className="fill-violet" {...pop} />

      <rect x="46" y="102" width="176" height="10" rx="5" className="fill-white/28" />
      <rect x="46" y="120" width="132" height="10" rx="5" className="fill-white/28" />
      <rect x="46" y="146" width="196" height="4" rx="2" className="fill-white/12" />
      <rect x="46" y="158" width="164" height="4" rx="2" className="fill-white/12" />
      <motion.rect x="46" y="178" width="76" height="22" rx="11" className="fill-violet" {...pop} />
      <rect x="132" y="178" width="66" height="22" rx="11" className="fill-white/[0.07] stroke-white/12" strokeWidth="1" />

      <rect x="256" y="102" width="98" height="98" rx="12" className="fill-violet/14 stroke-violet/25" strokeWidth="1" />
      <path
        d="M268 178 L292 152 L310 166 L342 124"
        fill="none"
        className="stroke-violet-soft/70"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ── 06 Software — an application shell ─────────────────────────────────── */

function SoftwareVisual() {
  return (
    <Svg>
      <rect x="26" y="24" width="348" height="202" rx="16" className="fill-white/[0.04] stroke-white/10" strokeWidth="1" />
      <line x1="112" y1="24" x2="112" y2="226" className="stroke-white/10" strokeWidth="1" />
      <line x1="26" y1="62" x2="374" y2="62" className="stroke-white/10" strokeWidth="1" />

      <rect x="42" y="38" width="10" height="10" rx="3" className="fill-violet" />
      <rect x="58" y="41" width="34" height="4" rx="2" className="fill-white/25" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x="42"
            y={80 + i * 26}
            width={i === 1 ? 58 : 48 - i * 3}
            height="5"
            rx="2.5"
            className={i === 1 ? "fill-violet-soft/80" : "fill-white/14"}
          />
        </g>
      ))}
      <rect x="34" y="100" width="70" height="18" rx="6" className="fill-violet/12" />

      <rect x="128" y="78" width="106" height="46" rx="10" className="fill-white/[0.05] stroke-white/[0.08]" strokeWidth="1" />
      <rect x="248" y="78" width="106" height="46" rx="10" className="fill-white/[0.05] stroke-white/[0.08]" strokeWidth="1" />
      <motion.rect x="142" y="94" width="46" height="9" rx="4.5" className="fill-violet-soft" {...pop} />
      <rect x="142" y="109" width="66" height="4" rx="2" className="fill-white/12" />
      <rect x="262" y="94" width="34" height="9" rx="4.5" className="fill-white/30" />
      <rect x="262" y="109" width="58" height="4" rx="2" className="fill-white/12" />

      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1="128" y1={146 + i * 22} x2="354" y2={146 + i * 22} className="stroke-white/[0.07]" strokeWidth="1" />
          <rect x="128" y={154 + i * 22} width={62 - i * 6} height="4" rx="2" className="fill-white/14" />
          <rect x="212" y={154 + i * 22} width={44} height="4" rx="2" className="fill-white/10" />
          <rect
            x="308"
            y={150 + i * 22}
            width="46"
            height="12"
            rx="6"
            className={i === 0 ? "fill-violet/30" : "fill-white/[0.07]"}
          />
        </g>
      ))}
    </Svg>
  );
}

/* ── 07 Automation — a workflow that runs itself ────────────────────────── */

const NODES = [
  { x: 30, y: 62, w: 76, label: "LEAD" },
  { x: 138, y: 62, w: 60, label: "AI" },
  { x: 230, y: 62, w: 70, label: "CRM" },
  { x: 138, y: 156, w: 104, label: "FOLLOW-UP" },
  { x: 274, y: 156, w: 76, label: "SALES" },
];

function AutomationVisual() {
  const reduced = useReducedMotion();
  return (
    <Svg>
      <g className="stroke-white/12" strokeWidth="1" fill="none">
        <path d="M106 82 L138 82" />
        <path d="M198 82 L230 82" />
        <path d="M300 82 Q332 82 332 108 L332 150 Q332 176 306 176 L274 176" />
        <path d="M138 176 L106 176 Q80 176 80 150 L80 108" strokeDasharray="4 5" />
        <path d="M242 176 L274 176" />
      </g>

      {NODES.map((node, i) => (
        <motion.g
          key={node.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 * i, ease: EASE }}
        >
          <rect
            x={node.x}
            y={node.y}
            width={node.w}
            height="40"
            rx="12"
            className={
              i === 1
                ? "fill-violet/25 stroke-violet/45"
                : "fill-white/[0.05] stroke-white/12"
            }
            strokeWidth="1"
          />
          <text
            x={node.x + node.w / 2}
            y={node.y + 25}
            textAnchor="middle"
            className={i === 1 ? "fill-violet-soft font-mono" : "fill-white/55 font-mono"}
            fontSize="9"
            letterSpacing="0.14em"
          >
            {node.label}
          </text>
        </motion.g>
      ))}

      {/* the signal travelling the path */}
      {!reduced && (
        <motion.circle
          r="3.5"
          className="fill-violet-soft"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 1, 1, 0],
            cx: [112, 168, 262, 332, 300, 250],
            cy: [82, 82, 82, 132, 176, 176],
          }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.12, 0.4, 0.62, 0.82, 1] }}
        />
      )}

      <text x="30" y="222" className="fill-white/25 font-mono" fontSize="8" letterSpacing="0.16em">
        RUNS WITHOUT ANYONE WATCHING IT
      </text>
    </Svg>
  );
}

/* ── 08 Systems — everything on one hub ─────────────────────────────────── */

const SATELLITES = [
  { angle: -90, label: "WEB" },
  { angle: -30, label: "CRM" },
  { angle: 30, label: "ADS" },
  { angle: 90, label: "DATA" },
  { angle: 150, label: "CONTENT" },
  { angle: 210, label: "AUTO" },
];

function SystemsVisual() {
  const reduced = useReducedMotion();
  const cx = 200;
  const cy = 125;
  const r = 82;

  return (
    <Svg>
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        className="stroke-white/[0.08]"
        strokeWidth="1"
        strokeDasharray="3 7"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={reduced ? undefined : { duration: 48, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r={r + 26} fill="none" className="stroke-white/[0.04]" strokeWidth="1" />

      {SATELLITES.map((sat, i) => {
        const rad = (sat.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        return (
          <motion.g
            key={sat.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: EASE }}
          >
            <line x1={cx} y1={cy} x2={x} y2={y} className="stroke-white/[0.09]" strokeWidth="1" />
            <circle cx={x} cy={y} r="19" className="fill-white/[0.06] stroke-white/12" strokeWidth="1" />
            <text
              x={x}
              y={y + 3}
              textAnchor="middle"
              className="fill-white/45 font-mono"
              fontSize="7"
              letterSpacing="0.1em"
            >
              {sat.label}
            </text>
          </motion.g>
        );
      })}

      <motion.g {...pop}>
        <circle cx={cx} cy={cy} r="34" className="fill-violet/20 stroke-violet/40" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="22" className="fill-violet" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-white font-mono" fontSize="10" letterSpacing="0.04em">
          nlogn
        </text>
      </motion.g>
    </Svg>
  );
}

const VISUALS: Record<CapabilityVisualKey, () => React.ReactElement> = {
  social: SocialVisual,
  creative: CreativeVisual,
  seo: SeoVisual,
  paid: PaidVisual,
  web: WebVisual,
  software: SoftwareVisual,
  automation: AutomationVisual,
  systems: SystemsVisual,
};

export function CapabilityVisual({ name }: { name: CapabilityVisualKey }) {
  const Visual = VISUALS[name];
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.055),rgba(255,255,255,0.012))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_70%_at_75%_5%,rgba(108,71,255,0.22),transparent_62%)]" />
      <Visual />
    </div>
  );
}
