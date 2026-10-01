"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { gsap } from "gsap";
import "./card-swap.css";

/**
 * CardSwap — ported from React Bits (JS + CSS variant) to TypeScript.
 *
 * Two variants:
 *  - "drop" is upstream's: every `delay` ms the front card falls away and
 *    returns at the back.
 *  - "flow" never stops. Cards travel right to left in one continuous loop:
 *    each enters from the right at the back, glides forward to the front,
 *    eases almost to a halt there, then slides out left and fades. Position
 *    is a pure function of time, so there are no timelines to queue and no
 *    stop-start seams between swaps.
 *
 * Other changes from upstream: cards further back are dimmed for depth,
 * `onSwap` reports the card now in front, reduced motion shows a still stack,
 * and positioning is left to the caller's `className`.
 */

type CardProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export function Card({ className, ...rest }: CardProps) {
  return <div {...rest} className={`cs-card${className ? ` ${className}` : ""}`} />;
}

type Slot = { x: number; y: number; z: number; zIndex: number; dim: number };

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
  dim: Math.min(i * 0.14, 0.4),
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    "--cs-dim": slot.dim,
    force3D: true,
  });

const EASINGS = {
  elastic: { ease: "elastic.out(0.6,0.9)", durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 },
  linear: { ease: "power1.inOut", durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Props = {
  width?: number | string;
  height?: number | string;
  /** Spacing between stacked cards along x and y. */
  cardDistance?: number;
  verticalDistance?: number;
  variant?: "drop" | "flow";
  /** drop: ms between swaps. */
  delay?: number;
  /** flow: seconds each card takes to move up one slot. */
  period?: number;
  /**
   * flow: how much the motion slows as a card reaches the front, 0–0.95.
   * 0 is a constant glide; near 1 almost pauses. It never fully stops.
   */
  settle?: number;
  /** flow: px per slot a leaving card travels left (it fades within half a slot). */
  exitDistance?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  onSwap?: (frontIdx: number) => void;
  skewAmount?: number;
  easing?: keyof typeof EASINGS;
  className?: string;
  children: ReactNode;
};

export function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  variant = "drop",
  delay = 5000,
  period = 4,
  settle = 0.8,
  exitDistance = 320,
  pauseOnHover = false,
  onCardClick,
  onSwap,
  skewAmount = 6,
  easing = "elastic",
  className,
  children,
}: Props) {
  const childArr = Children.toArray(children);
  const count = childArr.length;

  const container = useRef<HTMLDivElement>(null);
  const onSwapRef = useRef(onSwap);

  useEffect(() => {
    onSwapRef.current = onSwap;
  }, [onSwap]);

  /* ── drop: upstream behaviour ─────────────────────────────────────────── */
  useEffect(() => {
    if (variant !== "drop") return;
    const cards = Array.from(container.current?.children ?? []) as HTMLElement[];
    if (cards.length !== count) return;
    const config = EASINGS[easing];

    let order = Array.from({ length: count }, (_, i) => i);
    cards.forEach((el, i) => placeNow(el, makeSlot(i, cardDistance, verticalDistance, count), skewAmount));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || count < 2) return;

    let tl: gsap.core.Timeline | null = null;
    const swap = () => {
      if (tl?.isActive()) return;
      const [front, ...rest] = order;
      const elFront = cards[front];
      const t = gsap.timeline();
      tl = t;

      t.to(elFront, { y: "+=500", duration: config.durDrop, ease: config.ease });
      t.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      t.call(() => onSwapRef.current?.(rest[0]), undefined, "promote");
      rest.forEach((idx, i) => {
        const slot = makeSlot(i, cardDistance, verticalDistance, count);
        t.set(cards[idx], { zIndex: slot.zIndex }, "promote");
        t.to(
          cards[idx],
          { x: slot.x, y: slot.y, z: slot.z, "--cs-dim": slot.dim, duration: config.durMove, ease: config.ease },
          `promote+=${i * 0.15}`,
        );
      });

      const backSlot = makeSlot(count - 1, cardDistance, verticalDistance, count);
      t.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
      t.call(() => void gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, "return");
      t.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          "--cs-dim": backSlot.dim,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return",
      );
      t.call(() => {
        order = [...rest, front];
      });
    };

    let interval = window.setInterval(swap, delay);
    const node = container.current;
    const pause = () => window.clearInterval(interval);
    const resume = () => {
      window.clearInterval(interval);
      interval = window.setInterval(swap, delay);
    };
    if (pauseOnHover && node) {
      node.addEventListener("mouseenter", pause);
      node.addEventListener("mouseleave", resume);
    }

    return () => {
      window.clearInterval(interval);
      tl?.kill();
      if (pauseOnHover && node) {
        node.removeEventListener("mouseenter", pause);
        node.removeEventListener("mouseleave", resume);
      }
    };
  }, [variant, count, cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  /* ── flow: a continuous right-to-left loop ────────────────────────────── */
  useEffect(() => {
    if (variant !== "flow") return;
    const node = container.current;
    const cards = Array.from(node?.children ?? []) as HTMLElement[];
    if (!node || cards.length !== count || count < 2) return;

    const k = Math.min(Math.max(settle, 0), 0.95);
    const back = count - 1;

    /**
     * Lay every card out for progress `p` (1 = every card has moved one slot).
     * A card's slot `s` runs from `back + 0.5` (arriving, rear right) down to
     * 0 (front), then on to -0.5 as it leaves to the left and wraps round.
     * The half-slot margins mean all cards are showing whenever one is
     * exactly at the front.
     */
    const layout = (p: number) => {
      cards.forEach((el, i) => {
        let s = (((i - p) % count) + count) % count;
        if (s > back + 0.5) s -= count;

        const leaving = s < 0;
        gsap.set(el, {
          x: leaving ? s * exitDistance : s * cardDistance,
          y: leaving ? 0 : -s * verticalDistance,
          z: leaving ? -s * 40 : -s * cardDistance * 1.6,
          rotateY: leaving ? -s * 14 : -s * 4,
          scale: leaving ? 1 + s * 0.04 : 1 - s * 0.07,
          // Fade out on the way left; fade in over the last stretch at the rear.
          opacity: leaving ? clamp01(1 + s * 2.2) : clamp01((back + 0.5 - s) / 0.4),
          zIndex: Math.round(100 - s * 10),
          "--cs-dim": leaving ? 0 : Math.min(s * 0.16, 0.4),
        });
      });
    };

    gsap.set(cards, { xPercent: -50, yPercent: -50, skewY: skewAmount, transformOrigin: "center center", force3D: true });
    layout(0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Progress slows around whole numbers — whenever a card is exactly at the
    // front — then picks up again. Its speed dips but never reaches zero.
    let front = 0;
    let visible = true;
    const start = gsap.ticker.time;
    const tick = () => {
      if (!visible) return;
      const t = (gsap.ticker.time - start) / period;
      const p = t - (k * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);
      layout(p);
      const next = ((Math.round(p) % count) + count) % count;
      if (next !== front) {
        front = next;
        onSwapRef.current?.(next);
      }
    };
    gsap.ticker.add(tick);

    // No per-frame work while the hero is scrolled out of view.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(node);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, [variant, count, cardDistance, verticalDistance, period, settle, exitDistance, skewAmount]);

  return (
    <div ref={container} className={`cs-container${className ? ` ${className}` : ""}`} style={{ width, height }}>
      {childArr.map((child, i) => {
        if (!isValidElement(child)) return child;
        const el = child as ReactElement<CardProps>;
        return cloneElement(el, {
          key: i,
          style: { width, height, ...(el.props.style ?? {}) },
          onClick: (e) => {
            el.props.onClick?.(e);
            onCardClick?.(i);
          },
        });
      })}
    </div>
  );
}
