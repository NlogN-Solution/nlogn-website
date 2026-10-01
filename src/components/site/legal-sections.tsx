/**
 * A legal page's body in the home page's row pattern: a numbered heading on
 * the left, its paragraphs on the right, each row on a hairline.
 */
export function LegalSections({
  sections,
  children,
}: {
  sections: { h: string; p: string[] }[];
  /** A final row whose body needs markup (links), as `<p>` elements. */
  children?: React.ReactNode;
}) {
  const rows = sections.length + (children ? 1 : 0);
  return (
    <section className="page-section">
      <div className="wrap">
        <div className="legal-rows">
          {sections.map((s, i) => (
            <article key={s.h}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h2>{s.h}</h2>
              <div>
                {s.p.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </article>
          ))}
          {children && (
            <article>
              <span>{String(rows).padStart(2, "0")}</span>
              <h2>Contact</h2>
              <div>{children}</div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
