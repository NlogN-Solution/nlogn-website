"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { nav, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        scrolled ? "border-b border-line/80 bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="container-x grid h-[4.75rem] grid-cols-[1fr_auto] items-center gap-6 md:h-[5.5rem] lg:grid-cols-[1fr_auto_1fr]">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center justify-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors duration-200 xl:px-5",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-4 -bottom-0.5 h-px bg-violet"
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/contact"
            className="group hidden h-[3.1rem] items-center gap-3 rounded-[0.9rem] bg-ink pl-6 pr-2 text-[0.9375rem] font-medium text-white shadow-soft transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-lift sm:inline-flex"
          >
            Let&apos;s talk
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-violet text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45"
            >
              <ArrowUpRight className="size-4" strokeWidth={2.2} />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-[0.8rem] border border-line bg-surface text-ink transition-colors hover:border-ink/25 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-[4.75rem] z-40 overflow-y-auto border-t border-line bg-canvas px-5 pb-10 pt-6 lg:hidden"
          >
            <ul className="divide-y divide-line">
              {nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between py-5 font-display text-2xl font-bold tracking-tight text-ink"
                  >
                    {item.label}
                    <ArrowUpRight className="size-5 text-muted" />
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 space-y-4">
              <Link
                href="/contact"
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[0.9rem] bg-ink font-medium text-white"
              >
                Start a project
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <a href={`mailto:${siteConfig.email}`} className="block text-center text-sm text-muted">
                {siteConfig.email}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
