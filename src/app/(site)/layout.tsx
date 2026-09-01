import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { Analytics } from "@/components/site/analytics";
import { ContactWidget } from "@/components/site/contact-widget";
import { CookieConsent } from "@/components/site/cookie-consent";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getSettings } from "@/server/services/settings.service";

/**
 * The public website's chrome.
 *
 * This lives in a route group rather than in the root layout so the admin
 * dashboard — a different product in the same deployment — does not inherit the
 * marketing header, footer, cookie banner and chat widget. A route group
 * changes no URLs: `/(site)/about` is still `/about`.
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
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <JsonLd schema={[organizationSchema(), websiteSchema()]} id="site-schema" />
      <Analytics />
      <ContactWidget whatsappNumber={settings.whatsappNumber} />
      <CookieConsent />
    </>
  );
}
