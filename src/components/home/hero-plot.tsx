import { nlognPath, nlognPoint } from "@/components/ui/growth-curve";
import { cn } from "@/lib/utils";

/**
 * The hero plot.
 *
 * The company is named after a complexity class, so the hero shows the class:
 * a real n·log(n) curve pulling away from a straight line, with the widening
 * gap between them shaded. That gap is the whole pitch — compounding output
 * against linear effort — and it is plotted from `nlognPath`, the same function
 * every other curve on the site is drawn from.
 *
 * Each annotated point is a pair: where a business sits on the straight line
 * today, and where the same metric lands on the curve. The vertical distance
 * between the two is the delta, labelled with the multiple.
 *
 * The figures are an illustrative model of a typical engagement, not a
 * guarantee — edit PAIRS to put your own aggregates in.
 */

const W = 900;
const H = 470;
const PAD = 7;

/**
 * Where the straight line lands, as a share of the curve's final height. Set
 * low on purpose: the wedge between the two is the argument the hero is making,
 * so it has to be legible at a glance rather than a hairline.
 */
const LINEAR_END = 0.34;

const curve = nlognPath(W, H, 96, PAD);
const start = nlognPoint(W, H, 0, PAD);
const end = nlognPoint(W, H, 1, PAD);
const linearEndY = start.y - (start.y - end.y) * LINEAR_END;

/** Curve down to the straight line, back along it, closed — the gap. */
const gap = `${curve} L ${end.x} ${linearEndY} L ${start.x} ${start.y} Z`;

type Pair = {
  /** Position along the curve, 0-1. */
  t: number;
  label: string;
  /** Where the business sits on the straight line today. */
  before: string;
  /** Where the same metric lands on the curve. */
  after: string;
  multiple: string;
};

const PAIRS: Pair[] = [
  {
    t: 0.42,
    label: "Conversion rate",
    before: "1.1%",
    after: "3.4%",
    multiple: "3.1x",
  },
  {
    t: 0.74,
    label: "Qualified leads a month",
    before: "40",
    after: "290",
    multiple: "7.2x",
  },
];

const MONTHS = ["M1", "M3", "M6", "M9", "M12"];

export function HeroPlot({ className }: { className?: string }) {
  // Both lines are parameterised on the same x, so a pair shares one column.
  const pairs = PAIRS.map((pair) => ({
    ...pair,
    curve: nlognPoint(W, H, pair.t, PAD),
    linearY: start.y + (linearEndY - start.y) * pair.t,
  }));

  return (
    <div className={cn("@container relative w-full", className)}>
      <div className="relative aspect-[900/470] w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 size-full overflow-visible"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="hero-curve-stroke" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="46%" stopColor="#6c47ff" />
              <stop offset="100%" stopColor="#3d17b4" />
            </linearGradient>
            <linearGradient id="hero-gap-fill" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#6c47ff" stopOpacity="0.04" />
              <stop offset="55%" stopColor="#6c47ff" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.26" />
            </linearGradient>
            <radialGradient id="hero-tip-glow">
              <stop offset="0%" stopColor="#6c47ff" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#6c47ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* graph paper, barely there */}
          <g stroke="#0b0b0f" strokeOpacity="0.055" strokeWidth="1">
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={start.x}
                x2={end.x}
                y1={start.y - (start.y - end.y) * f}
                y2={start.y - (start.y - end.y) * f}
              />
            ))}
            {MONTHS.map((_, i) => {
              const x = start.x + ((end.x - start.x) * i) / (MONTHS.length - 1);
              return <line key={i} x1={x} x2={x} y1={end.y} y2={start.y} />;
            })}
          </g>

          {/* linear effort — what the curve is measured against */}
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={linearEndY}
            stroke="#0b0b0f"
            strokeOpacity="0.24"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          />

          <path d={gap} fill="url(#hero-gap-fill)" className="anim-in" style={{ "--d": "0.7s" } as React.CSSProperties} />

          <path
            d={curve}
            stroke="url(#hero-curve-stroke)"
            strokeWidth="3.25"
            strokeLinecap="round"
            style={{
              strokeDasharray: 2400,
              strokeDashoffset: 2400,
              animation: "draw 2.4s cubic-bezier(0.16,1,0.3,1) 0.3s forwards",
            }}
          />

          {/* one column per pair: curve dot, connector, line dot */}
          {pairs.map((pair) => (
            <g key={pair.label}>
              <line
                x1={pair.curve.x}
                y1={pair.curve.y}
                x2={pair.curve.x}
                y2={pair.linearY}
                stroke="#6c47ff"
                strokeOpacity="0.45"
                strokeWidth="1.25"
                strokeDasharray="3 4"
                className="anim-in"
                style={{ "--d": "1.5s" } as React.CSSProperties}
              />
              <circle
                cx={pair.curve.x}
                cy={pair.linearY}
                r="4"
                fill="#fff"
                stroke="#0b0b0f"
                strokeOpacity="0.3"
                strokeWidth="2"
                className="anim-pop"
                style={{ "--d": "1.55s" } as React.CSSProperties}
              />
              <circle
                cx={pair.curve.x}
                cy={pair.curve.y}
                r="5.5"
                fill="#fff"
                stroke="#6c47ff"
                strokeWidth="2.5"
                className="anim-pop"
                style={{ "--d": "1.6s" } as React.CSSProperties}
              />
            </g>
          ))}

          {/* where the curve is headed */}
          <circle cx={end.x} cy={end.y} r="46" fill="url(#hero-tip-glow)" />
          <circle cx={end.x} cy={end.y} r="7" fill="#6c47ff" className="anim-pop" style={{ "--d": "2.2s" } as React.CSSProperties} />
          <circle cx={end.x} cy={end.y} r="7" fill="#6c47ff" className="origin-center animate-ping opacity-60" />
        </svg>

        {/* ── overlay ────────────────────────────────────────────────────
            Positioning and animation are kept on separate elements: `fade-up`
            ends at `transform: none`, so anything with its own translate has to
            sit on a wrapper the animation never touches. */}

        <div className="absolute left-0 top-0">
          <p
            className="anim-in flex items-center gap-2 font-mono text-[clamp(0.6rem,1.2cqw,0.75rem)] tracking-[0.08em] text-muted"
            style={{ "--d": "0.35s" } as React.CSSProperties}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-violet" />
            f(n) = n · log n
          </p>
          <p
            className="anim-in mt-1.5 pl-[0.9rem] font-mono text-[clamp(0.55rem,1.1cqw,0.6875rem)] uppercase tracking-[0.14em] text-muted/70"
            style={{ "--d": "0.5s" } as React.CSSProperties}
          >
            Typical engagement · 12 months
          </p>
        </div>

        <div
          className="absolute -translate-x-full translate-y-[0.7em] pr-[0.9em]"
          style={{ left: `${(end.x / W) * 100}%`, top: `${(linearEndY / H) * 100}%` }}
        >
          <p
            className="anim-in whitespace-nowrap font-mono text-[clamp(0.58rem,1.15cqw,0.6875rem)] uppercase tracking-[0.16em] text-muted/80"
            style={{ "--d": "1.1s" } as React.CSSProperties}
          >
            Linear effort
          </p>
        </div>

        <div
          className="absolute -translate-x-full -translate-y-[2.4em] pr-[0.9em]"
          style={{ left: `${(end.x / W) * 100}%`, top: `${(end.y / H) * 100}%` }}
        >
          <p
            className="anim-in whitespace-nowrap font-mono text-[clamp(0.58rem,1.15cqw,0.6875rem)] uppercase tracking-[0.16em] text-violet"
            style={{ "--d": "2.3s" } as React.CSSProperties}
          >
            Compounding output
          </p>
        </div>

        {pairs.map((pair) => (
          <div key={pair.label}>
            {/* where it lands, above the curve */}
            <div
              className="absolute -translate-x-1/2 -translate-y-[calc(100%+1.7em)]"
              style={{
                left: `${(pair.curve.x / W) * 100}%`,
                top: `${(pair.curve.y / H) * 100}%`,
              }}
            >
              <div
                className="anim-in w-max rounded-[0.85em] border border-line bg-surface/95 px-[1.05em] py-[0.8em] text-[clamp(0.62rem,1.5cqw,0.875rem)] shadow-[0_1px_2px_rgba(11,11,15,0.04),0_16px_36px_-16px_rgba(31,17,74,0.28)] backdrop-blur"
                style={{ "--d": "1.75s" } as React.CSSProperties}
              >
                <p className="font-mono text-[0.72em] uppercase tracking-[0.14em] text-violet">
                  With nlogn
                </p>
                <p className="mt-[0.5em] font-display text-[1.55em] font-semibold leading-none tracking-[-0.04em] text-violet">
                  {pair.after}
                </p>
                <p className="mt-[0.5em] text-[0.92em] leading-tight text-ink">{pair.label}</p>
              </div>
            </div>

            {/* the multiple the gap represents */}
            <div
              className="absolute -translate-y-1/2 translate-x-[0.7em]"
              style={{
                left: `${(pair.curve.x / W) * 100}%`,
                top: `${((pair.curve.y + pair.linearY) / 2 / H) * 100}%`,
              }}
            >
              <span
                className="anim-pop block rounded-full bg-violet px-[0.7em] py-[0.3em] font-mono text-[clamp(0.55rem,1.1cqw,0.6875rem)] uppercase tracking-[0.1em] text-white"
                style={{ "--d": "1.9s" } as React.CSSProperties}
              >
                {pair.multiple}
              </span>
            </div>

            {/* where it sits today, on the straight line */}
            <div
              className="absolute -translate-x-full -translate-y-1/2 pr-[0.8em]"
              style={{
                left: `${(pair.curve.x / W) * 100}%`,
                top: `${(pair.linearY / H) * 100}%`,
              }}
            >
              <p
                className="anim-in w-max whitespace-nowrap font-mono text-[clamp(0.55rem,1.15cqw,0.6875rem)] uppercase tracking-[0.12em] text-muted"
                style={{ "--d": "1.65s" } as React.CSSProperties}
              >
                Before · {pair.before}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* the axis this all sits on, labelled like one */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        {MONTHS.map((month) => (
          <span
            key={month}
            className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted/70"
          >
            {month}
          </span>
        ))}
      </div>
    </div>
  );
}
