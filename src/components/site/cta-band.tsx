import Link from "next/link";
import { ContactArrow } from "@/components/landing/motion/scroll-effects";
import { site } from "@/config/landing";

/**
 * The closing call to action: the home page's blue contact section (see
 * `components/landing/sections/contact.tsx`), with a per-page headline.
 */
export function CtaBand({
  title = "Let’s make it work.",
  lead = "Tell us the number you need to move. We will come back within one working day with an honest read on whether we can move it — and what it would take.",
}: {
  title?: React.ReactNode;
  lead?: string;
}) {
  return (
    <section className="contact contact-page" id="contact">
      <div className="wrap">
        <p className="eyebrow">Have something in mind?</p>
        <div className="contact-head">
          <h2>{title}</h2>
          <ContactArrow href={site.contactUrl} label="Start your project on NLOGN’s contact page" />
        </div>
        <div className="contact-bottom">
          <p>{lead}</p>
          <Link className="button white" href={site.contactUrl}>
            Tell us what you’re thinking <span>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
