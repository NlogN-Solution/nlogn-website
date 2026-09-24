import { site } from "@/content/site";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Wordmark } from "./Wordmark";

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
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NLOGN</span>
        <span>Made with care, in Nepal.</span>
        <div>
          {site.legal.map((link) => (
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
