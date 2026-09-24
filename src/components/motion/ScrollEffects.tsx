"use client";

import Image, { type ImageProps } from "next/image";
import { useRef, type ReactNode } from "react";
import {
  clamp,
  isInViewport,
  useScrollFrame,
  viewportProgress,
} from "./MotionProvider";

export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useScrollFrame(({ vh }) => {
    if (!bar.current) return;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - vh);
    bar.current.style.transform = `scaleX(${clamp(scrollY / scrollable)})`;
  });
  return <div ref={bar} className="reading-progress" aria-hidden="true" />;
}

/** Hero artwork that drifts and scales as the hero scrolls away. */
export function HeroBackdrop(props: ImageProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  useScrollFrame(({ vh, vw, paused }) => {
    if (paused || !wrap.current || !img.current) return;
    const rect = wrap.current.getBoundingClientRect();
    if (rect.bottom <= 0) return;
    const p = clamp(-rect.top / vh);
    img.current.style.transform = `translate3d(0,${p * (vw > 700 ? 95 : 35)}px,0) scale(${1 + p * 0.09})`;
  });
  return (
    <div ref={wrap} className="hero-backdrop">
      <Image ref={img} {...props} alt={props.alt} />
    </div>
  );
}

/** Muted text that darkens to ink as it scrolls into view. */
export function InkText({ children }: { children: ReactNode }) {
  const el = useRef<HTMLSpanElement>(null);
  useScrollFrame(({ vh, paused }) => {
    if (paused || !el.current) return;
    const top = el.current.getBoundingClientRect().top;
    const ink = clamp((vh * 0.9 - top) / (vh * 0.5));
    el.current.style.color = `rgb(${Math.round(124 - ink * 101)},${Math.round(126 - ink * 102)},${Math.round(125 - ink * 100)})`;
  });
  return (
    <span ref={el} className="muted">
      {children}
    </span>
  );
}

/**
 * Image with scroll parallax, measured against its closest `trackSelector`
 * ancestor so the motion follows the whole card rather than the image alone.
 */
export function ParallaxImage({
  trackSelector,
  ...props
}: ImageProps & {
  trackSelector: string;
}) {
  const img = useRef<HTMLImageElement>(null);
  useScrollFrame(({ vh, paused }) => {
    const track = img.current?.closest(trackSelector);
    if (paused || !img.current || !track) return;
    const rect = track.getBoundingClientRect();
    if (!isInViewport(rect, vh)) return;
    const p = viewportProgress(rect, vh);
    img.current.style.transform = `scale(1.1) translate3d(0,${(p - 0.5) * 45}px,0)`;
  });
  return <Image ref={img} {...props} alt={props.alt} />;
}

export function ContactArrow({ href, label }: { href: string; label: string }) {
  const arrow = useRef<HTMLAnchorElement>(null);
  useScrollFrame(({ vh, paused }) => {
    const section = arrow.current?.closest(".contact");
    if (paused || !arrow.current || !section) return;
    const rect = section.getBoundingClientRect();
    if (!isInViewport(rect, vh)) return;
    const p = viewportProgress(rect, vh);
    arrow.current.style.transform = `rotate(${(1 - p) * -35}deg)`;
  });
  return (
    <a ref={arrow} className="contact-arrow" href={href} aria-label={label}>
      ↗
    </a>
  );
}
