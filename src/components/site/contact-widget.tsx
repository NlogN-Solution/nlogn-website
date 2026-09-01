"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, MessageCircle, Sparkles, X } from "lucide-react";
import { ChatPanel } from "@/components/site/chat-panel";
import { whatsappUrl } from "@/config/contact-widget";
import { noConsentOnServer, readConsent, subscribeConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

/**
 * Floating contact widget: a launcher, a two-way choice, and the AI chat.
 *
 * The launcher never opens the bot straight away — a visitor who wants a person
 * should not have to talk to a robot first, so the choice panel comes first and
 * WhatsApp sits above the assistant in it.
 *
 * The panel hangs off the launcher (`absolute bottom-full right-0`) so it
 * tracks it when the cookie banner pushes the launcher up. Its width is a flat
 * `22rem` capped by `max-w`, never a `100vw` width: `100vw` counts the
 * scrollbar, which is exactly how a floating panel ends up a notch wider than
 * the page it sits on. As a `max-width` the same expression is harmless — the
 * flat width wins wherever there is room for it.
 */

type View = "choice" | "chat";
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function ContactWidget({ whatsappNumber }: { whatsappNumber?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("choice");
  const reduced = useReducedMotion();

  // The cookie banner owns the bottom of a phone screen until it is answered,
  // so the launcher steps above it rather than sitting on top of it.
  const consent = useSyncExternalStore(subscribeConsent, readConsent, noConsentOnServer);
  const bannerShowing = consent === null;

  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  // Escape closes from anywhere inside the widget.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Clicking away closes it too — but the explicit × is always there, because
  // click-outside is not a control anyone can find with a keyboard.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openWhatsApp = useCallback(() => {
    window.open(whatsappUrl(undefined, whatsappNumber), "_blank", "noopener,noreferrer");
    setOpen(false);
  }, [whatsappNumber]);

  return (
    <div
      className={cn(
        "fixed right-4 z-[70] flex flex-col items-end gap-3 transition-[bottom] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:right-6 sm:bottom-6",
        bannerShowing ? "bottom-[13.5rem] sm:bottom-6" : "bottom-4 sm:bottom-6",
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="contact-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={view === "chat" ? "AI assistant" : "Contact options"}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className={cn(
              // Anchored to both edges on a phone so it can never be wider than
              // the screen; a fixed width once there is room for one.
              "absolute bottom-full right-0 mb-3 w-[22rem] max-w-[calc(100vw-2rem)]",
              "flex max-h-[min(32rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-[22px] border border-line bg-surface shadow-lift",
            )}
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => setView("choice")}
                  aria-label="Back to contact options"
                  className="-ml-1.5 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">
                  {view === "chat" ? "AI Assistant" : "Let's talk"}
                </p>
                <p className="truncate text-xs text-muted">
                  {view === "chat"
                    ? "Answers from our site, not a human"
                    : "How would you like to connect?"}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-1.5 ml-auto grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            {view === "choice" ? (
              <div className="flex flex-col gap-3 p-5">
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-canvas p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#25D366]/50 hover:shadow-soft"
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#25D366]/12 text-[#128C7E]"
                  >
                    <WhatsAppMark className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">
                      Talk on WhatsApp
                    </span>
                    <span className="block text-[0.8125rem] text-muted">
                      Chat directly with our team
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setView("chat")}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-canvas p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-violet/50 hover:shadow-soft"
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-wash text-violet"
                  >
                    <Sparkles className="size-5" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">
                      Chat with AI Assistant
                    </span>
                    <span className="block text-[0.8125rem] text-muted">
                      Get instant answers from our AI
                    </span>
                  </span>
                </button>
              </div>
            ) : (
              <ChatPanel onWhatsApp={openWhatsApp} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setView("choice");
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Close contact options" : "Open contact options"}
        className="group relative grid size-14 place-items-center rounded-full bg-ink text-white shadow-lift transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-violet active:scale-95"
      >
        {/* One slow halo, only while closed and only if motion is welcome. */}
        {!open && !reduced && (
          <span
            aria-hidden
            className="absolute inset-0 -z-10 animate-ping rounded-full bg-violet/25 [animation-duration:3.5s]"
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: reduced ? 0 : -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: reduced ? 0 : 45 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="grid place-items-center"
          >
            {open ? (
              <X className="size-6" strokeWidth={2} aria-hidden />
            ) : (
              <MessageCircle className="size-6" strokeWidth={1.9} aria-hidden />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

/** WhatsApp's glyph — lucide has no brand marks. */
function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.19 8.19 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
