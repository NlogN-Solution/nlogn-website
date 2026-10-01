import { faqs as homeFaqs } from "@/config/landing";

type Props = {
  eyebrow?: string;
  title?: React.ReactNode;
  items?: { q: string; a: string }[];
};

/** Reused off the home page with its own eyebrow, heading and questions. */
export function Faq({
  eyebrow = "07 / Before we start",
  title = (
    <>
      A few things
      <br />
      you might ask.
    </>
  ),
  items = homeFaqs,
}: Props = {}) {
  return (
    <section className="faq wrap">
      <div className="reveal">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="faq-list reveal">
        {items.map((faq) => (
          <details key={faq.q}>
            <summary>
              {faq.q}
              <span>+</span>
            </summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
