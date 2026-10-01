import Link from "next/link";
import { Footer } from "@/components/landing/layout/footer";
import { Header } from "@/components/landing/layout/header";
import { MotionProvider } from "@/components/landing/motion/motion-provider";
import { capabilities } from "@/config/capabilities";
import "./(home)/landing.css";
import "./(site)/site.css";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/*
 * Rendered by the root layout alone (an unknown URL, or `notFound()` from any
 * page), so it brings the site's chrome with it rather than inheriting it.
 */
export default function NotFound() {
  return (
    <div className="nlh">
      <MotionProvider>
        <Header />
        <main id="main">
          <section className="page-hero">
            <div className="wrap">
              <div className="section-top">
                <p className="eyebrow">Error 404</p>
                <span className="eyebrow">Nothing at this address</span>
              </div>
              <h1 className="page-title">
                This page did not make <em>the cut.</em>
              </h1>
              <div className="page-hero-foot">
                <div className="page-lead">
                  <p>
                    The URL is wrong, or the page has moved. Here is everything that definitely
                    does exist.
                  </p>
                </div>
                <div className="page-hero-actions">
                  <Link className="button blue" href="/">
                    Back to home <span aria-hidden="true">↗</span>
                  </Link>
                  <Link className="button outline" href="/contact">
                    Tell us what broke
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <section className="page-section is-tight">
            <div className="wrap">
              <ul className="panels" style={{ "--cols": 3 } as React.CSSProperties}>
                {capabilities.map((capability) => (
                  <li key={capability.id} className="panel">
                    <span className="eyebrow">{capability.label}</span>
                    <h3>
                      <Link href="/works">{capability.title}</Link>
                    </h3>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
        <Footer />
      </MotionProvider>
    </div>
  );
}
