"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type FrameInfo = { vh: number; vw: number; paused: boolean };
type FrameCallback = (frame: FrameInfo) => void;

type MotionContextValue = {
  paused: boolean;
  subscribe: (callback: FrameCallback) => () => void;
  requestFrame: () => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

// Elements carrying the `reveal` class animate in once they scroll into view.
// Styles in globals.css only hide them once `motion-ready` is on <html>, so
// server-rendered content stays visible if JavaScript never runs.
function useRevealObserver() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToPreference(onChange: () => void) {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const prefersReducedMotion = () => matchMedia(REDUCED_MOTION).matches;

export function MotionProvider({ children }: { children: ReactNode }) {
  // Motion follows the visitor's system setting for reduced motion.
  const paused = useSyncExternalStore(
    subscribeToPreference,
    prefersReducedMotion,
    () => false,
  );

  const pausedRef = useRef(paused);
  const callbacks = useRef(new Set<FrameCallback>());
  const frame = useRef(0);

  const requestFrame = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const info = {
        vh: window.innerHeight,
        vw: window.innerWidth,
        paused: pausedRef.current,
      };
      callbacks.current.forEach((cb) => cb(info));
    });
  }, []);

  const subscribe = useCallback(
    (callback: FrameCallback) => {
      callbacks.current.add(callback);
      requestFrame();
      return () => {
        callbacks.current.delete(callback);
      };
    },
    [requestFrame],
  );

  useEffect(() => {
    pausedRef.current = paused;
    document.documentElement.classList.toggle("motion-paused", paused);
    requestFrame();
  }, [paused, requestFrame]);

  useEffect(() => {
    document.documentElement.classList.add("motion-ready");
    const onVisibility = () => {
      if (!document.hidden) requestFrame();
    };
    addEventListener("scroll", requestFrame, { passive: true });
    addEventListener("resize", requestFrame, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      removeEventListener("scroll", requestFrame);
      removeEventListener("resize", requestFrame);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [requestFrame]);

  useRevealObserver();

  return (
    <MotionContext.Provider value={{ paused, subscribe, requestFrame }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) throw new Error("useMotion must be used inside <MotionProvider>");
  return context;
}

/** Runs `callback` on every scroll/resize animation frame. */
export function useScrollFrame(callback: FrameCallback) {
  const { subscribe } = useMotion();
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => subscribe((info) => latest.current(info)), [subscribe]);
}

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/** Progress (0 → 1) of an element travelling up through the viewport. */
export function viewportProgress(rect: DOMRect, vh: number) {
  return clamp((vh - rect.top) / (vh + rect.height));
}

export const isInViewport = (rect: DOMRect, vh: number) =>
  rect.top < vh && rect.bottom > 0;
