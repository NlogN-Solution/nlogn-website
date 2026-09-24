"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useMotion } from "./MotionProvider";

/*
 * Letters thicken as the pointer comes near them, by interpolating variable
 * font axes per letter. Adapted from React Bits' <VariableProximity />
 * (reactbits.dev): same props and falloff maths, without the `motion`
 * dependency (it only used motion.span as a plain span), and it recomputes
 * on pointer movement instead of on every animation frame.
 */

type Falloff = "linear" | "exponential" | "gaussian";

type Props = {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: Falloff;
  className?: string;
};

function parseSettings(settings: string) {
  return new Map(
    settings.split(",").map((part) => {
      const [name, value] = part.trim().split(/\s+/);
      return [name.replace(/['"]/g, ""), parseFloat(value)] as const;
    }),
  );
}

export function VariableProximity({
  label,
  fromFontVariationSettings,
  toFontVariationSettings,
  containerRef,
  radius = 50,
  falloff = "linear",
  className = "",
}: Props) {
  const { paused } = useMotion();
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  const axes = useMemo(() => {
    const from = parseSettings(fromFontVariationSettings);
    const to = parseSettings(toFontVariationSettings);
    return [...from].map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: to.get(axis) ?? fromValue,
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  useEffect(() => {
    if (paused) return;
    let frame = 0;
    let x = 0;
    let y = 0;

    const strength = (distance: number) => {
      const norm = clampUnit(1 - distance / radius);
      if (falloff === "exponential") return norm ** 2;
      if (falloff === "gaussian") return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
      return norm;
    };

    const update = () => {
      frame = 0;
      if (!containerRef.current) return;
      letters.current.forEach((letter) => {
        if (!letter) return;
        const rect = letter.getBoundingClientRect();
        const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
        if (distance >= radius) {
          letter.style.fontVariationSettings = fromFontVariationSettings;
          return;
        }
        const t = strength(distance);
        letter.style.fontVariationSettings = axes
          .map(({ axis, fromValue, toValue }) => `'${axis}' ${fromValue + (toValue - fromValue) * t}`)
          .join(", ");
      });
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    const nodes = letters.current;
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
      nodes.forEach((letter) => letter && (letter.style.fontVariationSettings = ""));
    };
  }, [paused, axes, containerRef, falloff, fromFontVariationSettings, radius]);

  const words = label.split(" ");
  let index = 0;

  return (
    <span className={`${className} variable-proximity`}>
      {words.map((word, w) => (
        <span key={w} className="vp-word">
          {[...word].map((char) => {
            const i = index++;
            return (
              <span
                key={i}
                ref={(el) => {
                  letters.current[i] = el;
                }}
                className="vp-letter"
                aria-hidden="true"
              >
                {char}
              </span>
            );
          })}
          {w < words.length - 1 && (
            <span className="vp-letter" aria-hidden="true">
              &nbsp;
            </span>
          )}
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

const clampUnit = (v: number) => Math.min(1, Math.max(0, v));
