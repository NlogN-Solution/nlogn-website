"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { serviceArt, services, type Service } from "@/content/site";
import { serviceDemos } from "./ServiceDemos";

type Id = Service["id"];

const CLOSE_DURATION = 560; // panel collapse (550ms) before its demo is rewound

/*
 * Hover accordion. One shared `activeId` decides the open service.
 *
 * Opening a panel moves the rows below it. When that happens under a still
 * pointer the browser fires pointerenter on whatever row slides beneath it,
 * which would switch panels and start an oscillation. Enter/move events that
 * arrive without the pointer actually moving are therefore ignored: only
 * deliberate pointer movement changes the open service.
 */
export function Services() {
  const [activeId, setActiveId] = useState<Id | null>(null);
  const activeRef = useRef<Id | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const pointerType = useRef("mouse");
  const demoRefs = useRef<Partial<Record<Id, HTMLDivElement | null>>>({});
  const resetTimers = useRef<
    Partial<Record<Id, ReturnType<typeof setTimeout>>>
  >({});

  const open = (id: Id | null) => {
    activeRef.current = id;
    setActiveId(id);
  };

  // Demos play once per opening and are rewound only once hidden.
  useEffect(() => {
    const timers = resetTimers.current;
    if (activeId) {
      clearTimeout(timers[activeId]);
      demoRefs.current[activeId]?.classList.add("is-played");
    }
    for (const { id } of services) {
      if (
        id === activeId ||
        !demoRefs.current[id]?.classList.contains("is-played")
      )
        continue;
      clearTimeout(timers[id]);
      timers[id] = setTimeout(() => {
        const demo = demoRefs.current[id];
        if (!demo || activeRef.current === id) return;
        demo.classList.add("is-resetting");
        demo.classList.remove("is-played");
        void demo.offsetWidth;
        demo.classList.remove("is-resetting");
      }, CLOSE_DURATION);
    }
  }, [activeId]);

  // Track real pointer movement; a genuine move outside the list closes it.
  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      if (activeRef.current && !listRef.current?.contains(e.target as Node))
        open(null);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    const timers = resetTimers.current;
    return () => {
      document.removeEventListener("pointermove", onMove);
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // True when the pointer is where it last was: the event came from layout
  // moving under it, not from the visitor.
  const stationary = (e: PointerEvent) =>
    lastPointer.current !== null &&
    lastPointer.current.x === e.clientX &&
    lastPointer.current.y === e.clientY;

  const onRowPointer = (id: Id) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || stationary(e)) return;
    if (activeRef.current !== id) open(id);
  };

  const onRowClick = (id: Id) => (e: MouseEvent<HTMLButtonElement>) => {
    const fromKeyboard = e.detail === 0;
    if (!fromKeyboard && pointerType.current === "mouse") {
      open(id); // hover already opened it; a click never closes it
    } else {
      open(activeRef.current === id ? null : id); // touch, pen and keys toggle
    }
  };

  // Keyboard focus opens a service; focus from a tap or click does not.
  const onRowFocus = (id: Id) => (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(":focus-visible")) open(id);
  };

  const onListBlur = (e: FocusEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || list.contains(e.relatedTarget as Node | null)) return;
    if (!list.matches(":hover")) open(null);
  };

  return (
    <section className="services" id="services">
      <div className="wrap">
        <div className="section-top">
          <p className="eyebrow">03 / What we do</p>
          <span className="eyebrow">One team. Connected thinking.</span>
        </div>
        <div className="heading-row reveal">
          <h2>
            Build it.
            <br />
            Connect it.
            <br />
            <em>Put it to work.</em>
          </h2>
          <div className="service-art">
            <span className="service-art-label">{serviceArt.label}</span>
            <Image
              src={serviceArt.image.src}
              alt={serviceArt.image.alt}
              width={serviceArt.image.width}
              height={serviceArt.image.height}
              sizes="(max-width: 700px) 90vw, 44vw"
            />
          </div>
        </div>
        <div
          ref={listRef}
          className="svc-list"
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onBlur={onListBlur}
        >
          {services.map((service, i) => {
            const isOpen = activeId === service.id;
            const rowId = `svc-row-${service.id}`;
            const panelId = `svc-panel-${service.id}`;
            return (
              <div
                key={service.id}
                className={`svc-item${isOpen ? " is-open" : ""}`}
              >
                <h3 className="svc-heading">
                  <button
                    type="button"
                    id={rowId}
                    className="svc-row"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={`${service.title} ${service.label}`}
                    onPointerEnter={onRowPointer(service.id)}
                    onPointerMove={onRowPointer(service.id)}
                    onFocus={onRowFocus(service.id)}
                    onClick={onRowClick(service.id)}
                  >
                    <span className="svc-num" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="svc-title">{service.title}</span>
                    <span className="svc-cat" aria-hidden="true">
                      {service.label}
                    </span>
                    <span className="svc-plus" aria-hidden="true">
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  className="svc-panel"
                  role="region"
                  aria-labelledby={rowId}
                  inert={!isOpen}
                >
                  <div className="svc-panel-inner">
                    <div className="svc-content">
                      <div className="svc-copy">
                        <p className="svc-desc">{service.body}</p>
                        <ul className="svc-tags">
                          {service.tags.map((tag) => (
                            <li key={tag}>{tag}</li>
                          ))}
                        </ul>
                        <span className="svc-outcome">{service.outcome}</span>
                        <a href="#contact" className="svc-link">
                          {service.cta}
                        </a>
                      </div>
                      <div
                        ref={(el) => {
                          demoRefs.current[service.id] = el;
                        }}
                        className="svc-demo sd"
                        aria-hidden="true"
                      >
                        {serviceDemos[service.id]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
