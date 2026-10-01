/**
 * Cookie consent, shared between the banner, the analytics loader and the
 * inline script that runs before anything hydrates.
 *
 * The choice lives in localStorage rather than a cookie, so no cookie exists
 * until the visitor has actually agreed to one. Google Consent Mode is driven
 * off the same value: denied by default, updated the moment a choice is made.
 */

export type ConsentChoice = "granted" | "denied";

/** Bump the suffix to re-ask everyone — e.g. when a new tool is added. */
export const CONSENT_KEY = "nlogn.cookie-consent.v1";

/** Fired on the window whenever the stored choice changes. */
export const CONSENT_EVENT = "nlogn:consent-change";

/** Fired to reopen the banner from the footer's "Cookie settings" link. */
export const CONSENT_SETTINGS_EVENT = "nlogn:cookie-settings";

/** Private browsing and blocked storage both throw rather than return null. */
export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage unavailable — the choice holds for this page view only, which is
    // the privacy-safe direction to fail in.
  }

  window.gtag?.("consent", "update", {
    analytics_storage: choice,
  });

  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/**
 * `useSyncExternalStore` subscription, so components read the choice without a
 * setState-in-effect round trip. `readConsent` is the client snapshot; the
 * server snapshot is always null, which is what keeps hydration matching.
 */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

export const noConsentOnServer = (): ConsentChoice | null => null;

/**
 * Runs before hydration, ahead of any Google script.
 *
 * Everything starts denied, so gtag.js can never write a cookie on a first
 * visit. A returning visitor who already accepted is granted here rather than
 * waiting for React, which keeps their session from being split in two.
 */
export const CONSENT_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
try {
  if (window.localStorage.getItem('${CONSENT_KEY}') === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (e) {}
`;
