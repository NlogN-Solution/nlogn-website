"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { nav, siteConfig, type NavItem } from "@/config/site";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** A parent counts as active when the page sits under any of its children. */
function isActive(item: NavItem, pathname: string) {
  const match = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return match(item.href) || (item.children?.some((c) => match(c.href)) ?? false);
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
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
    setMenu(null);
  }

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

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

        <nav
          aria-label="Primary"
          className="hidden items-center justify-center gap-1 lg:flex"
          onMouseLeave={() => setMenu(null)}
        >
          {nav.map((item) => {
            const active = isActive(item, pathname);
            const linkClass = cn(
              "relative rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors duration-200 xl:px-5",
              active ? "text-ink" : "text-ink-soft hover:text-ink",
            );
            const underline = active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-x-4 -bottom-0.5 h-px bg-violet"
                transition={{ duration: 0.4, ease: EASE }}
              />
            );

            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClass}
                  onMouseEnter={() => setMenu(null)}
                >
                  {item.label}
                  {underline}
                </Link>
              );
            }

            const isOpen = menu === item.label;
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setMenu(item.label)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setMenu(isOpen ? null : item.label)}
                  className={cn(linkClass, "inline-flex items-center gap-1.5")}
                >
                  {item.label}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "size-3.5 transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                  />
                  {underline}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.99 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      className="absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3"
                    >
                      <div className="overflow-hidden rounded-[1.1rem] border border-line bg-surface/95 p-2 shadow-lift backdrop-blur-xl">
                        {item.children.map((child) => {
                          const childActive =
                            pathname === child.href || pathname.startsWith(`${child.href}/`);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMenu(null)}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "group flex items-start gap-3 rounded-[0.8rem] px-4 py-3 transition-colors duration-200",
                                childActive ? "bg-violet-wash" : "hover:bg-canvas-2/70",
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "mt-[0.45rem] size-1.5 shrink-0 rounded-full transition-colors",
                                  childActive ? "bg-violet" : "bg-line group-hover:bg-violet/60",
                                )}
                              />
                              <span>
                                <span className="block text-[0.9375rem] font-medium text-ink">
                                  {child.label}
                                </span>
                                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">
                                  {child.description}
                                </span>
                              </span>
                            </Link>
                          );
                        })}

                        <Link
                          href={item.href}
                          onClick={() => setMenu(null)}
                          className="mt-1 flex items-center justify-between rounded-[0.8rem] border-t border-line-soft px-4 py-3 text-[0.875rem] font-medium text-ink transition-colors hover:text-violet-deep"
                        >
                          All resources
                          <ArrowUpRight className="size-3.5" aria-hidden />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
            className="grid size-11 place-items-center rounded-[0.8rem] border border-line bg-surface text-ink shadow-soft-sm transition-all hover:border-ink/20 hover:shadow-soft active:shadow-inset lg:hidden"
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
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: EASE }}
                >
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={sub === item.label}
                        onClick={() => setSub(sub === item.label ? null : item.label)}
                        className="flex w-full items-center justify-between py-5 text-left font-display text-2xl font-bold tracking-tight text-ink"
                      >
                        {item.label}
                        <ChevronDown
                          aria-hidden
                          className={cn(
                            "size-5 text-muted transition-transform duration-300",
                            sub === item.label && "rotate-180 text-violet",
                          )}
                        />
                      </button>
                      {/* grid-rows keeps the links in the DOM while collapsed */}
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          sub === item.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <ul className="space-y-1 pb-5 pl-4">
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className="flex items-center justify-between rounded-[0.8rem] py-3 pl-4 pr-2 text-[1.0625rem] font-medium text-ink-soft"
                                >
                                  <span className="flex items-center gap-3">
                                    <span aria-hidden className="size-1.5 rounded-full bg-violet/50" />
                                    {child.label}
                                  </span>
                                  <ArrowUpRight className="size-4 text-muted" aria-hidden />
                                </Link>
                              </li>
                            ))}
                            <li>
                              <Link
                                href={item.href}
                                className="flex items-center justify-between rounded-[0.8rem] py-3 pl-4 pr-2 text-[0.9375rem] font-medium text-violet-deep"
                              >
                                All {item.label.toLowerCase()}
                                <ArrowUpRight className="size-4" aria-hidden />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between py-5 font-display text-2xl font-bold tracking-tight text-ink"
                    >
                      {item.label}
                      <ArrowUpRight className="size-5 text-muted" />
                    </Link>
                  )}
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
