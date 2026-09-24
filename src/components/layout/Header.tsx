"use client";

import { useEffect, useRef, useState } from "react";
import { navLinks } from "@/content/site";
import { Wordmark } from "./Wordmark";

export function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

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

  const close = () => setOpen(false);

  return (
    <>
      <header>
        <div className="wrap header-inner">
          <Wordmark />
          <nav aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a className="nav-cta" href="#contact">
            Have a project? <span>↗</span>
          </a>
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
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>
            {link.label}
          </a>
        ))}
        <a href="#contact" onClick={close}>
          Have a project?
        </a>
      </nav>
    </>
  );
}
