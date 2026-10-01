import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/config/site";

/** Client quotes on the home page's dark band (the `.services` ground). */
export function Testimonials({ eyebrow = "In their words" }: { eyebrow?: string }) {
  return (
    <section className="page-section is-dark" aria-label="Client testimonials">
      <div className="wrap">
        <SectionHeading
          eyebrow={eyebrow}
          aside="Client reviews"
          title={
            <>
              What our clients
              <br />
              <em>actually say.</em>
            </>
          }
          lead="Websites, software, search and automation — in the words of the people we built them for."
        />
        <ul className="quotes reveal">
          {testimonials.slice(0, 3).map((t) => (
            <li key={t.name}>
              <figure>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <b>{t.name}</b>
                  {t.role}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
