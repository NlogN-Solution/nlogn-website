import Link from "next/link";
import { site } from "@/config/landing";
import { ContactArrow } from "@/components/landing/motion/scroll-effects";

export function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <p className="eyebrow">Have something in mind?</p>
        <div className="contact-head">
          <h2>
            Let’s make
            <br />
            it <em>work.</em>
          </h2>
          <ContactArrow
            href={site.contactUrl}
            label="Start your project on NLOGN’s contact page"
          />
        </div>
        <div className="contact-bottom reveal">
          <p>
            A rough idea. A messy process.
            <br />A business ready for its next chapter.
          </p>
          <Link className="button white" href={site.contactUrl}>
            Tell us what you’re thinking <span>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
