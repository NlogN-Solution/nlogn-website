"use client";

import { CONSENT_SETTINGS_EVENT } from "@/lib/consent";

/** Reopens the cookie banner, so a choice is never final. */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_SETTINGS_EVENT))}
      className="transition-colors hover:text-ink"
    >
      Cookie settings
    </button>
  );
}
