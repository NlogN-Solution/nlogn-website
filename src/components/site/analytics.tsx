"use client";

import { useSyncExternalStore } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { noConsentOnServer, readConsent, subscribeConsent } from "@/lib/consent";
import { siteConfig } from "@/config/site";

/**
 * Google Analytics 4, and Tag Manager when a container is configured.
 *
 * Nothing renders — and no Google script is requested — until the visitor has
 * accepted in the cookie banner. Consent Mode defaults are set before hydration
 * by the bootstrap script in the root layout, so even a race cannot write a
 * cookie ahead of the choice.
 *
 * The measurement ID falls back to `siteConfig.gaId`, so a deploy is tagged
 * without anyone having to remember an environment variable:
 *
 *   NEXT_PUBLIC_GA_ID   G-XXXXXXXXXX   overrides the built-in GA4 property
 *   NEXT_PUBLIC_GTM_ID  GTM-XXXXXXX    optional, only if the site runs GTM too
 *
 * `next dev` never loads it at all, so local browsing stays out of the property.
 *
 * The Next.js components load gtag.js after hydration and re-send a page_view
 * on App Router navigations, which a hand-rolled <Script> tag does not do.
 */
export function Analytics() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, noConsentOnServer);

  if (process.env.NODE_ENV !== "production" || consent !== "granted") return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID || siteConfig.gaId;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
