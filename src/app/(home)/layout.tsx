import { JsonLd } from "@/components/seo/json-ld";
import { Analytics } from "@/components/site/analytics";
import { ContactWidget } from "@/components/site/contact-widget";
import { CookieConsent } from "@/components/site/cookie-consent";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getSettings } from "@/server/services/settings.service";
import { dmSans, spaceGrotesk } from "../fonts";
import "./landing.css";

/**
 * The home page's chrome.
 *
 * The home page carries its own header, footer and type system (see
 * `landing.css`), so it sits in its own route group instead of `(site)`. It
 * keeps everything from the site layout that is not visual chrome: the site
 * schema, analytics, the cookie banner and the contact widget.
 *
 * Every landing style is scoped under `.nlh`, so none of it reaches another
 * route, even after a client-side navigation leaves the stylesheet loaded.
 */
export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <>
      <div className={`nlh ${dmSans.variable} ${spaceGrotesk.variable}`}>{children}</div>
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
