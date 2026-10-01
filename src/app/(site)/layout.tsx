import { Footer } from "@/components/landing/layout/footer";
import { Header } from "@/components/landing/layout/header";
import { MotionProvider } from "@/components/landing/motion/motion-provider";
import { ReadingProgress } from "@/components/landing/motion/scroll-effects";
import { JsonLd } from "@/components/seo/json-ld";
import { Analytics } from "@/components/site/analytics";
import { ContactWidget } from "@/components/site/contact-widget";
import { CookieConsent } from "@/components/site/cookie-consent";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getSettings } from "@/server/services/settings.service";
import "../(home)/landing.css";
import "./site.css";

/**
 * The public website's chrome.
 *
 * This lives in a route group rather than in the root layout so the admin
 * dashboard — a different product in the same deployment — does not inherit the
 * marketing header, footer, cookie banner and chat widget. A route group
 * changes no URLs: `/(site)/about` is still `/about`.
 *
 * It is the home page's chrome, put together the same way as (home)/layout.tsx
 * and page.tsx: the `.nlh` wrapper, the landing header and footer, and the
 * motion provider. Pages are built from the landing sections and the page
 * patterns in `site.css`; Tailwind UI inside them sits in `.site-theme`
 * islands (see globals.css).
 *
 * Keeping it out of the root layout also means the root never has to read
 * `headers()` to work out which product it is rendering, which would have made
 * every statically generated page dynamic.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Settings fall back to the committed config, so this resolves without a
  // database and the layout still renders if the CMS is down.
  const settings = await getSettings();

  return (
    <>
      <div className="nlh">
        <MotionProvider>
          <ReadingProgress />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </MotionProvider>
      </div>
      <JsonLd schema={[organizationSchema(), websiteSchema()]} id="site-schema" />
      <Analytics />
      {/* Floating UI: Tailwind, themed like the rest of the page. */}
      <div className="nlh">
        <div className="site-theme">
          <ContactWidget whatsappNumber={settings.whatsappNumber} />
          <CookieConsent />
        </div>
      </div>
    </>
  );
}
