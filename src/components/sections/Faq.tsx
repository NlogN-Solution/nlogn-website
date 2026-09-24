import { faqs } from "@/content/site";

export function Faq() {
  return (
    <section className="faq wrap">
      <div className="reveal">
        <p className="eyebrow">07 / Before we start</p>
        <h2>
          A few things
          <br />
          you might ask.
        </h2>
      </div>
      <div className="faq-list reveal">
        {faqs.map((faq) => (
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
