"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { scatter, type SiteImage } from "@/content/site";
import { clamp, useMotion, useScrollFrame } from "@/components/motion/MotionProvider";

/*
 * A stack of cards that spreads out around the headline as the section is
 * scrolled through, and stacks back up on the way up.
 *
 * Geometry is in reference pixels, measured from the design reference: a
 * 1210 × 610 landscape stage and a 390 × 844 portrait stage for phones. CSS
 * turns those into real sizes with one unit, --u = min(vw / refW, vh / refH),
 * so the composition keeps its proportions on every screen. The resting
 * (spread) layout is pure CSS; script only applies the offset from the pile,
 * so without script or motion the final layout is what shows.
 */

type Box = { x: number; y: number; w: number; h: number };
type Pose = { x: number; y: number; r: number; rx: number; ry: number };
type Card = {
  key: string;
  desktop: Box;
  mobile: Box;
  /** Pose in the pile, on the landscape stage (scaled down for portrait). */
  stack: Pose;
  /** Share of the scroll to wait before moving; top cards leave first. */
  delay: number;
  content: ReactNode;
};

const DESKTOP = { w: 1210, h: 610, stackScale: 1.57, stackSpread: 1 };
const MOBILE = { w: 390, h: 844, stackScale: 1.4, stackSpread: 0.45 };
const PORTRAIT = "(max-aspect-ratio: 9/10)";
const MAX_DELAY = 0.16;
// Matches the 0.9 factor in --u (globals.css): the page is set slightly zoomed out.
const SCALE = 0.9;

/** Image in a light frame with a numbered caption, so each service is named. */
function Photo({
  image,
  index,
  position,
}: {
  image: SiteImage & { label: string };
  index: number;
  position?: string;
}) {
  return (
    <figure className="scatter-frame">
      <div className="scatter-photo">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-aspect-ratio: 9/10) 300px, 480px"
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
      <figcaption>
        <span>{String(index).padStart(2, "0")}</span>
        {image.label}
      </figcaption>
    </figure>
  );
}

function Sparkline() {
  // n log n, sampled: the curve the studio is named after.
  const pts = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    return [(i / 7) * 96 + 2, 36 - ((n * Math.log2(n)) / 24) * 30] as const;
  });
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 100 40" aria-hidden="true">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} />
      <circle cx={ex} cy={ey} r="2.2" />
    </svg>
  );
}

const { images, stat, chart } = scatter;

// Listed back to front: this is also the stacking order of the pile.
const cards: Card[] = [
  {
    key: "software",
    desktop: { x: -404, y: -88, w: 236, h: 300 },
    mobile: { x: -118, y: -170, w: 120, h: 150 },
    stack: { x: -35, y: 55, r: -12.7, rx: 4, ry: -6 },
    delay: 0.05,
    content: <Photo image={images.software} index={2} />,
  },
  {
    key: "automation",
    desktop: { x: 156, y: -279, w: 190, h: 194 },
    mobile: { x: 92, y: -300, w: 140, h: 145 },
    stack: { x: 68, y: -7, r: 10.5, rx: -3, ry: 7 },
    delay: 0.02,
    content: <Photo image={images.automation} index={3} />,
  },
  {
    key: "marketing",
    desktop: { x: 377, y: -52, w: 170, h: 214 },
    mobile: { x: 125, y: -165, w: 100, h: 128 },
    stack: { x: 150, y: 54, r: 13.4, rx: 3, ry: 8 },
    delay: 0.07,
    content: <Photo image={images.marketing} index={4} />,
  },
  {
    key: "consulting",
    desktop: { x: 3, y: 192, w: 264, h: 148 },
    mobile: { x: 0, y: 335, w: 190, h: 112 },
    stack: { x: 6, y: 176, r: -5, rx: -5, ry: 3 },
    delay: 0.12,
    content: <Photo image={images.consulting} index={5} position="50% 35%" />,
  },
  {
    key: "web",
    desktop: { x: -374, y: 174, w: 280, h: 187 },
    mobile: { x: -105, y: 190, w: 160, h: 110 },
    stack: { x: -118, y: 107, r: -6, rx: -4, ry: -7 },
    delay: 0.1,
    content: <Photo image={images.web} index={1} />,
  },
  {
    key: "stat",
    desktop: { x: -140, y: -293, w: 190, h: 152 },
    mobile: { x: -95, y: -318, w: 150, h: 120 },
    stack: { x: -69, y: -12, r: -10, rx: 6, ry: -8 },
    delay: 0,
    content: (
      <div className="scatter-panel">
        <span className="scatter-label">{stat.label}</span>
        <span className="scatter-value">{stat.value}</span>
        <span className="scatter-note">{stat.note}</span>
      </div>
    ),
  },
  {
    key: "chart",
    desktop: { x: 345, y: 187, w: 210, h: 138 },
    mobile: { x: 100, y: 205, w: 150, h: 105 },
    stack: { x: 117, y: 105, r: 11.9, rx: -6, ry: 8 },
    delay: MAX_DELAY,
    content: (
      <div className="scatter-panel">
        <span className="scatter-label">{chart.label}</span>
        <Sparkline />
      </div>
    ),
  },
];

const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

function cardVars({ desktop: d, mobile: m }: Card, z: number) {
  return {
    "--dx": d.x, "--dy": d.y, "--dw": d.w, "--dh": d.h,
    "--mx": m.x, "--my": m.y, "--mw": m.w, "--mh": m.h,
    zIndex: z,
  } as CSSProperties;
}

export function ScatterCluster() {
  const { paused } = useMotion();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const shadowEls = useRef<(HTMLSpanElement | null)[]>([]);
  const target = useRef(0);
  const current = useRef(0);
  const loop = useRef(0);
  const last = useRef(0);

  function render(p: number) {
    const el = stage.current;
    if (!el) return;
    const portrait = matchMedia(PORTRAIT).matches;
    const ref = portrait ? MOBILE : DESKTOP;
    const u = SCALE * Math.min(window.innerWidth / ref.w, el.clientHeight / ref.h);

    cards.forEach((card, i) => {
      const node = cardEls.current[i];
      const shadow = shadowEls.current[i];
      if (!node || !shadow) return;
      const final = portrait ? card.mobile : card.desktop;
      const k = 1 - ease(clamp((p - card.delay) / (1 - MAX_DELAY)));
      const { x, y, r, rx, ry } = card.stack;
      const tx = (x * ref.stackSpread - final.x) * u * k;
      const ty = (y * ref.stackSpread - final.y) * u * k;
      const s = 1 + (ref.stackScale - 1) * k;
      node.style.transform =
        k === 0
          ? ""
          : `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${(r * k).toFixed(2)}deg) rotateX(${(rx * k).toFixed(2)}deg) rotateY(${(ry * k).toFixed(2)}deg) scale(${s.toFixed(4)})`;
      shadow.style.opacity = (0.2 + 0.6 * k).toFixed(3);
    });
    if (copy.current) copy.current.style.opacity = clamp((p - 0.08) / 0.32).toFixed(3);
  }

  function tick(now: number) {
    // Ease toward the scroll position, so the cards trail the scroll and
    // settle after it stops (about half a second, as in the reference).
    const dt = last.current ? Math.min(64, now - last.current) : 16;
    last.current = now;
    const diff = target.current - current.current;
    current.current = Math.abs(diff) < 0.0005 ? target.current : current.current + diff * (1 - Math.exp(-dt / 150));
    render(current.current);
    loop.current = current.current === target.current ? 0 : requestAnimationFrame(tick);
  }

  useScrollFrame(({ vh, paused: isPaused }) => {
    const el = section.current;
    if (!el || isPaused) return;
    const rect = el.getBoundingClientRect();
    const travel = Math.max(1, rect.height - (stage.current?.clientHeight ?? vh));
    // The last 15% of the pinned scroll holds the finished layout.
    target.current = clamp(-rect.top / travel / 0.85);
    if (!loop.current) {
      last.current = 0;
      loop.current = requestAnimationFrame(tick);
    }
  });

  // Motion off: clear every inline style so the CSS resting layout shows.
  useEffect(() => {
    if (!paused) return;
    cancelAnimationFrame(loop.current);
    loop.current = 0;
    current.current = target.current = 1;
    cardEls.current.forEach((n) => n && (n.style.transform = ""));
    shadowEls.current.forEach((n) => n && (n.style.opacity = ""));
    if (copy.current) copy.current.style.opacity = "";
  }, [paused]);

  useEffect(() => () => cancelAnimationFrame(loop.current), []);

  return (
    <section ref={section} className="scatter" aria-labelledby="scatter-title">
      <div ref={stage} className="scatter-stage">
        <div ref={copy} className="scatter-copy">
          <h2 id="scatter-title">
            {scatter.title[0]}
            <br />
            {scatter.title[1]}
          </h2>
          <p>
            {scatter.body[0]} <br className="desktop-break" />
            {scatter.body[1]}
          </p>
        </div>
        {cards.map((card, i) => (
          <div
            key={card.key}
            ref={(n) => {
              cardEls.current[i] = n;
            }}
            className={`scatter-card scatter-card-${card.key}`}
            style={cardVars(card, i + 1)}
          >
            <span
              ref={(n) => {
                shadowEls.current[i] = n;
              }}
              className="scatter-shadow"
              aria-hidden="true"
            />
            <div className="scatter-face">{card.content}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
