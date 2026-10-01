"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav } from "@/config/site";
import { Wordmark } from "./wordmark";

/*
 * The site's own navigation (`nav` in config/site.ts), drawn in the landing
 * page's style and used by every public route. Items with children open a
 * panel on hover, click or keyboard; on phones they list under a heading.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  // The home page ends on its own contact section; elsewhere, go to /contact.
  const cta = pathname === "/" ? "#contact" : "/contact";
  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // An open dropdown closes on Escape or on a press anywhere outside it.
  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    const onPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menu]);

  const close = () => setOpen(false);

  return (
    <>
      <header>
        <div className="wrap header-inner">
          <Wordmark />
          <nav ref={navRef} aria-label="Primary">
            {nav.map((item) => {
              if (!item.children) {
                return (
                  <Link key={item.href} href={item.href} aria-current={current(item.href)}>
                    {item.label}
                  </Link>
                );
              }
              const isOpen = menu === item.label;
              const panelId = `nav-panel-${item.label.toLowerCase()}`;
              return (
                <div
                  key={item.href}
                  className="nav-drop"
                  onPointerEnter={(e) => e.pointerType === "mouse" && setMenu(item.label)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && setMenu(null)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(null);
                  }}
                >
                  <button
                    type="button"
                    className="nav-drop-toggle"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setMenu(isOpen ? null : item.label)}
                  >
                    {item.label} <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  <div id={panelId} className="nav-drop-panel" hidden={!isOpen}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={current(child.href)}
                        onClick={() => setMenu(null)}
                      >
                        <span>{child.label}</span>
                        <small>{child.description}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <Link className="nav-cta" href={cta}>
            Have a project? <span>↗</span>
          </Link>
          <button
            ref={toggle}
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            Menu <span>{open ? "−" : "+"}</span>
          </button>
        </div>
      </header>
      <nav id="mobile-nav" aria-label="Mobile" hidden={!open}>
        {nav.map((item) =>
          item.children ? (
            <div key={item.href} className="mobile-group">
              <span className="eyebrow">{item.label}</span>
              {item.children.map((child) => (
                <Link key={child.href} href={child.href} onClick={close}>
                  {child.label}
                </Link>
              ))}
            </div>
          ) : (
            <Link key={item.href} href={item.href} onClick={close}>
              {item.label}
            </Link>
          ),
        )}
        <Link href={cta} onClick={close}>
          Have a project?
        </Link>
      </nav>
    </>
  );
}
