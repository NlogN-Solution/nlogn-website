"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONSENT_SETTINGS_EVENT,
  noConsentOnServer,
  readConsent,
  subscribeConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";

/**
 * Cookie banner.
 *
 * Nothing analytics-related loads until "Accept" is pressed — the banner is the
 * gate, not a notice about something already running. Accept and Decline carry
 * equal weight, and there is no dismiss affordance that could be mistaken for
 * consent; the only way to close it is to choose.
 *
 * The stored choice arrives through `useSyncExternalStore`, whose server
 * snapshot is null. The first client render therefore matches the HTML and the
 * banner appears a beat later, which is deliberate.
 */
export function CookieConsent() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, noConsentOnServer);
  const [reopened, setReopened] = useState(false);
  const reduced = useReducedMotion();

  // Reopening from the footer is UI state rather than stored state, so it lives
  // beside the store instead of in it.
  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(CONSENT_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_SETTINGS_EVENT, reopen);
  }, []);

  const choose = useCallback((choice: ConsentChoice) => {
    writeConsent(choice);
    setReopened(false);
  }, []);

  const open = reopened || consent === null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cookie-consent"
          role="region"
          aria-label="Cookie consent"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[60] p-4 md:inset-x-auto md:bottom-6 md:left-6 md:p-0"
        >
          <div className="mx-auto w-full max-w-[30rem] rounded-[26px] border border-line bg-surface p-6 shadow-lift md:mx-0 md:p-7">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-wash text-violet"
              >
                <Cookie className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">
                  We value your privacy
                </h2>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
                  We use cookies to analyse site traffic and improve your browsing
                  experience. By clicking &ldquo;Accept all&rdquo;, you consent to our use
                  of cookies. You can change your choice at any time. Read our{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-violet-deep underline-offset-4 hover:underline"
                  >
                    Privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="violet" size="sm" onClick={() => choose("granted")}>
                Accept all
              </Button>
              <Button variant="secondary" size="sm" onClick={() => choose("denied")}>
                Decline
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
