"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useMotion } from "./MotionProvider";

const PLAY_DELAY = 550; // demo starts this long after the flip begins
const CLOSE_DURATION = 420; // turning back; matches .project-rotor in globals.css
const SCROLL_SETTLE = 150; // hover is ignored until scrolling has paused this long

/*
 * Page-wide coordination, so only one card is ever moving or turned over:
 * - opening a card closes the open one, and waits until it has finished
 *   turning back before starting its own flip;
 * - hover caused by the page scrolling under a still pointer is ignored.
 */
let openCard: { close: () => void } | null = null;
let busyUntil = 0; // when the card currently turning back comes to rest
let lastScroll = 0;
let scrollListeners = 0;
const onScroll = () => {
  lastScroll = performance.now();
};
const scrolling = () => performance.now() - lastScroll < SCROLL_SETTLE;

/**
 * Project card whose content turns over. The card itself (`className`,
 * `header` and `footer`) stays still and takes the input; only the area
 * below the header rotates 180° from `front` to `back`. The demo on the
 * back plays once per entry and is reset while hidden. Mouse hover,
 * keyboard focus and touch taps all drive the same state.
 */
export function ProjectFlip({
  label,
  className,
  header,
  front,
  back,
  footer,
}: {
  label: string;
  /** Classes for the stable card, e.g. its colour tone. */
  className: string;
  header: ReactNode;
  front: ReactNode;
  back: ReactNode;
  footer?: ReactNode;
}) {
  const { paused } = useMotion();
  const [flipped, setFlipped] = useState(false);
  const flippedRef = useRef(false); // actually turned (or turning) over
  const wantedRef = useRef(false); // the visitor is asking for the back
  const backRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPointer = useRef("mouse");
  const handle = useRef({ close: () => {} });

  const play = () => {
    const back = backRef.current;
    if (!back) return;
    // Travel distances come from real layout (offsetLeft ignores the 3D
    // rotation), so the moving card lands exactly on its target column.
    const traveller = back.querySelector<HTMLElement>("[data-traveller]");
    const from = back.querySelector<HTMLElement>('[data-col="0"]');
    const to = back.querySelector<HTMLElement>('[data-col="1"]');
    if (traveller && from && to) {
      traveller.style.setProperty(
        "--travel",
        `${to.offsetLeft - from.offsetLeft}px`,
      );
    }
    back.classList.add("is-playing");
  };

  const reset = () => {
    const back = backRef.current;
    if (!back) return;
    back.classList.add("is-resetting"); // no transitions while rewinding
    back.classList.remove("is-playing");
    void back.offsetWidth;
    back.classList.remove("is-resetting");
  };

  const turnOver = () => {
    flippedRef.current = true;
    setFlipped(true);
    openCard = handle.current;
    clearTimeout(resetTimer.current);
    if (paused) play();
    else playTimer.current = setTimeout(play, PLAY_DELAY);
  };

  const turnBack = () => {
    flippedRef.current = false;
    setFlipped(false);
    if (openCard === handle.current) openCard = null;
    clearTimeout(playTimer.current);
    const duration = paused ? 0 : CLOSE_DURATION;
    busyUntil = performance.now() + duration;
    resetTimer.current = setTimeout(reset, duration); // rewind once hidden
  };

  const flip = (on: boolean) => {
    wantedRef.current = on;
    clearTimeout(openTimer.current);
    if (!on) {
      if (flippedRef.current) turnBack();
      return;
    }
    if (flippedRef.current) return;
    if (openCard && openCard !== handle.current) openCard.close();
    const wait = busyUntil - performance.now();
    if (wait > 0) {
      // Another card is still turning back: start once it is at rest.
      openTimer.current = setTimeout(
        () => wantedRef.current && turnOver(),
        wait,
      );
    } else {
      turnOver();
    }
  };

  useEffect(() => {
    handle.current.close = () => flip(false);
  });

  useEffect(() => {
    const self = handle.current;
    if (scrollListeners++ === 0)
      addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (--scrollListeners === 0) removeEventListener("scroll", onScroll);
      clearTimeout(openTimer.current);
      clearTimeout(playTimer.current);
      clearTimeout(resetTimer.current);
      if (openCard === self) openCard = null;
    };
  }, []);

  // Mouse: hover turns the card, but not while the page scrolls beneath a
  // still pointer; the first real movement afterwards counts instead.
  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && !scrolling()) flip(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && !wantedRef.current && !scrolling())
      flip(true);
  };
  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") flip(false);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
  };
  // Touch and pen toggle on tap; mouse is hover-only, so clicks are ignored.
  const onClick = () => {
    if (lastPointer.current !== "mouse") flip(!wantedRef.current);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    flip(!wantedRef.current);
  };

  return (
    <div
      className={`project-flip ${className}${flipped ? " is-flipped" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${label} product preview`}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
      // Keyboard focus reveals the back; a tap's focus does not (it would
      // fight the tap's own toggle).
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && flip(true)}
      onBlur={() => flip(false)}
    >
      {header}
      <div className={`project-rotor${flipped ? " is-flipped" : ""}`}>
        <div className="project-face project-front" aria-hidden="true">
          {front}
        </div>
        <div
          ref={backRef}
          className="project-face project-back"
          aria-hidden="true"
        >
          {back}
        </div>
      </div>
      {footer}
    </div>
  );
}
