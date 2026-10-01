"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardSwap } from "@/components/ui/card-swap";
import { cn } from "@/lib/utils";

/**
 * The hero showcase: three live product dashboards flowing right to left in a
 * continuous loop. Each card enters at the rear right, glides to the front,
 * eases almost to a stop, then slides out left — the motion never halts. The
 * caption underneath follows whichever card is in front, and each screenshot
 * pans slowly inside its card.
 */

const SHOWCASE = [
  {
    product: "Waypoint",
    area: "Student portal",
    title: "Waypoint — student portal",
    image: "/hero-section-images/ignition-stuent-dashboard.png",
    alt: "Student portal showing the next step, university offers and recent activity",
  },
  {
    product: "AI automation",
    area: "n8n content workflow",
    title: "Content pipeline — n8n workflow",
    image: "/hero-section-images/n8n.png",
    alt: "n8n workflow that researches, scores and writes content ideas with AI",
  },
  {
    product: "Beacon",
    area: "SEO & traffic console",
    title: "Beacon — SEO & traffic console",
    image: "/hero-section-images/nlogn-admin-dashboard.png",
    alt: "Admin console with Google Search Console and Analytics connected",
  },
];

/** Card size, and how far each card sits behind the one in front of it. */
const CARD_W = 520;
const CARD_H = 310;
const STEP_X = 64;
const STEP_Y = 16;
const BACK = SHOWCASE.length - 1;
/**
 * The stack's footprint: the front card, plus what the rear cards show past
 * its right and top edges once they have scaled down.
 */
const STAGE_W = CARD_W + 100;
const STAGE_H = CARD_H + STEP_Y * BACK + 8;

export function HeroShowcase({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const current = SHOWCASE[active];

  // The stack is laid out in fixed pixels; scale it down to fit the column.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / STAGE_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* soft violet bloom behind the stack */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 -z-10 bg-[radial-gradient(55%_55%_at_55%_45%,rgba(167,139,250,0.30),transparent_72%)]"
      />

      <div
        ref={frameRef}
        className="relative w-full"
        style={{ height: STAGE_H * scale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
          }}
        >
          <CardSwap
            className="absolute bottom-0 left-0"
            width={CARD_W}
            height={CARD_H}
            cardDistance={STEP_X}
            verticalDistance={STEP_Y}
            variant="flow"
            period={4}
            settle={0.8}
            exitDistance={240}
            skewAmount={0}
            onSwap={setActive}
          >
            {SHOWCASE.map((item) => (
              <Card
                key={item.image}
                className="border border-ink/[0.07] bg-white shadow-[0_1px_2px_rgba(11,11,15,0.04),0_30px_60px_-30px_rgba(69,38,201,0.45),0_12px_24px_-16px_rgba(11,11,15,0.18)]"
              >
                <div className="flex h-[34px] items-center gap-3 border-b border-ink/[0.06] bg-[#fbfaff] px-3.5">
                  <span aria-hidden className="flex gap-[5px]">
                    <i className="size-2 rounded-full bg-[#ff5f57]" />
                    <i className="size-2 rounded-full bg-[#febc2e]" />
                    <i className="size-2 rounded-full bg-[#28c840]" />
                  </span>
                  <span className="truncate rounded-md bg-[#f1eff7] px-2.5 py-[3px] text-[11px] text-ink-soft/80">
                    {item.title}
                  </span>
                </div>
                <div className="h-[calc(100%-34px)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size card, eagerly shown */}
                  <img
                    src={item.image}
                    alt={item.alt}
                    draggable={false}
                    className="cs-pan size-full select-none object-cover object-left-top"
                  />
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <p
          key={active}
          className="anim-in text-[0.9375rem] text-ink-soft"
          aria-live="polite"
        >
          <span className="font-semibold text-ink">{current.product}</span>
          <span className="mx-1.5 text-ink-soft/60">/</span>
          {current.area}
        </p>
        <div className="flex gap-2">
          {SHOWCASE.map((item, i) => (
            <span
              key={item.image}
              aria-hidden
              className={cn(
                "h-1.5 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                i === active ? "w-8 bg-violet" : "w-1.5 bg-ink/15",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
