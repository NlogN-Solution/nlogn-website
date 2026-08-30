import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { siteConfig, works } from "@/config/site";
import { capabilities } from "@/config/capabilities";
import { getCategories } from "@/lib/blog";

const company = [
  { label: "About us", href: "/about" },
  { label: "Our process", href: "/process" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  const categories = getCategories().slice(0, 5);
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-surface">
      <GrowthCurve
        width={1440}
        height={120}
        animate={false}
        className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full opacity-[0.07]"
        id="footer-curve"
      />

      <div className="container-x relative pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted">
              A digital growth studio building websites, software and search strategies
              that compound. Named after O(n log n) — more input, disproportionately
              more output.
            </p>
            <div className="mt-7">
              <p className="label mb-3 text-ink">The Growth Brief</p>
              <p className="mb-3 text-sm text-muted">
                One practical essay a month on web performance, SEO and growth. No pitch.
              </p>
              <NewsletterForm compact />
            </div>
          </div>

          <nav aria-label="What we do">
            <h2 className="label text-ink">What we do</h2>
            {/* Areas live on one page now, so these are labels with a single
                way in rather than eight links to the same URL. */}
            <ul className="mt-5 space-y-2.5">
              {capabilities.map((capability) => (
                <li key={capability.id} className="text-[0.9375rem] text-muted">
                  {capability.label}
                </li>
              ))}
            </ul>
            <Link
              href="/works"
              className="mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-ink transition-colors hover:text-violet-deep"
            >
              All areas of work
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </nav>

          <nav aria-label="Company">
            <h2 className="label text-ink">Company</h2>
            <ul className="mt-5 space-y-3">
              {company.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-[0.9375rem] text-muted transition-colors hover:text-ink"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="label mt-9 text-ink">Recent work</h2>
            <ul className="mt-5 space-y-3">
              {works.slice(0, 3).map((w) => (
                <li key={w.slug}>
                  <Link
                    href={`/case-studies/${w.slug}`}
                    className="text-[0.9375rem] text-muted transition-colors hover:text-ink"
                  >
                    {w.client}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="label text-ink">Contact</h2>
            <ul className="mt-5 space-y-4 text-[0.9375rem] text-muted">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-start gap-3 transition-colors hover:text-ink"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}
                  className="flex items-start gap-3 transition-colors hover:text-ink"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
                <span>
                  {siteConfig.address.street}
                  <br />
                  {siteConfig.address.city}, {siteConfig.address.countryName}
                </span>
              </li>
            </ul>

            <h2 className="label mt-9 text-ink">Read about</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/blog/category/${c.slug}`}
                    className="inline-block rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-violet/40 hover:text-violet"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted">
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <a href="/blog/rss.xml" className="transition-colors hover:text-ink">
              RSS
            </a>
            <a href="/sitemap.xml" className="transition-colors hover:text-ink">
              Sitemap
            </a>
            <span className="hidden h-4 w-px bg-line md:block" />
            {Object.entries(siteConfig.socials).map(([name, href]) => (
              <a
                key={name}
                href={href}
                rel="noopener noreferrer me"
                target="_blank"
                className="capitalize transition-colors hover:text-ink"
              >
                {name === "x" ? "X" : name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
