/**
 * The id a heading gets, so a table of contents has something to link to.
 *
 * One definition, used by both content paths — the TipTap renderer and the
 * CKEditor sanitiser — because `public-content.ts` reads these ids back out of
 * the stored HTML. Two implementations would drift, and the symptom would be a
 * contents list whose links quietly stop landing.
 */
export function headingSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Gives every h2/h3/h4 in a fragment a unique id, leaving any it already has.
 *
 * Runs over HTML that has already been sanitised, which is what makes the
 * regex safe here: the tag set and attribute set are known and closed by the
 * time this sees them.
 */
export function addHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(
    /<h([234])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (whole, level: string, attrs: string, inner: string) => {
      if (/\sid\s*=/.test(attrs)) return whole;

      const base = headingSlug(inner.replace(/<[^>]+>/g, ""));
      if (!base) return whole;

      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      const id = count > 1 ? `${base}-${count}` : base;

      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    },
  );
}
