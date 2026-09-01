/** `window.gtag` is defined by the consent bootstrap script in the root layout. */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export {};
