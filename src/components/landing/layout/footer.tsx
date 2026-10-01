import Link from "next/link";
import { footerNav, site } from "@/config/landing";
import { ExternalLink } from "@/components/landing/ui/external-link";
import { CookieSettingsLink } from "@/components/site/cookie-settings-link";
import { Wordmark } from "./wordmark";

export function Footer() {
  return (
    <footer className="wrap">
      <div className="footer-top">
        <Wordmark />
        <p>
          Thoughtfully designed.
          <br />
          Purposefully built.
        </p>
        <div>
          <a href={`mailto:${site.email}`}>{site.email} ↗</a>
          <a href={site.phone.href}>{site.phone.display}</a>
        </div>
        <div>
          {site.social.map((link) => (
            <ExternalLink key={link.href} href={link.href}>
              {link.label} ↗
            </ExternalLink>
          ))}
        </div>
      </div>
      <div className="footer-nav">
        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <span className="eyebrow">{group.title}</span>
            {group.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NLOGN</span>
        <span>Made with care, in Nepal.</span>
        <div>
          {site.legal.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <CookieSettingsLink />
          {site.feeds.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href="#">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
