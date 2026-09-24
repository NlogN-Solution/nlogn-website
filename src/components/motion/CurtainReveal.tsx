"use client";

import { useRef, type ReactNode } from "react";
import { clamp, useScrollFrame } from "./MotionProvider";

/**
 * `children` rise like a sheet over the `curtain` content, which holds still
 * underneath (sticky) and dims and recedes slightly as it's covered.
 *
 * Holding still is CSS (`position: sticky`), composited in step with the
 * scroll, so nothing shakes. Script only sets the pin offset for curtains
 * taller than the screen, and drives the cosmetic progress.
 */
export function CurtainReveal({
  curtain,
  children,
  anchorId,
}: {
  curtain: ReactNode;
  children: ReactNode;
  /** In-page link target that lands with the sheet at the top of the screen. */
  anchorId?: string;
}) {
  const pinRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useScrollFrame(({ vh, vw, paused }) => {
    const pin = pinRef.current;
    const shade = shadeRef.current;
    const sheet = sheetRef.current;
    if (!pin || !shade || !sheet) return;

    if (paused) {
      pin.style.top = pin.style.transform = pin.style.visibility = "";
      sheet.style.borderRadius = "";
      shade.style.opacity = "0";
      return;
    }

    // A curtain taller than the screen scrolls until its bottom edge shows,
    // then pins, so its last row (the client strip) is always seen.
    pin.style.top = `${Math.min(0, vh - pin.offsetHeight)}px`;

    // 0 until the sheet starts covering the pinned curtain, 1 once covered.
    // Measured against the visible curtain height, since on tall screens the
    // curtain is shorter than the viewport and the sheet starts on screen.
    const p = 1 - clamp(sheet.getBoundingClientRect().top / Math.min(vh, pin.offsetHeight));
    const radius = Math.round((1 - p) * (vw > 700 ? 48 : 28));
    sheet.style.borderRadius = `${radius}px ${radius}px 0 0`;
    pin.style.transform = p > 0 ? `scale(${1 - p * 0.06})` : "";
    shade.style.opacity = String(p * 0.55);
    // Once covered, hide it so it can't show below the sheet further down.
    pin.style.visibility = p >= 1 ? "hidden" : "";
  });

  return (
    <div className="curtain-scene">
      <div ref={pinRef} className="curtain-pin">
        <div className="curtain">{curtain}</div>
        <div ref={shadeRef} className="curtain-shade" aria-hidden="true" />
      </div>
      <div id={anchorId} className="curtain-anchor" aria-hidden="true" />
      <div ref={sheetRef} className="curtain-stage">
        {children}
      </div>
    </div>
  );
}
