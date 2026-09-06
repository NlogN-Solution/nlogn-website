/**
 * The public article body.
 *
 * One component for both content formats, because by the time HTML reaches
 * here the two are indistinguishable and should be: a CKEditor document has
 * been through the allow-list in `server/content-sanitize.ts` on the way into
 * the database, and a legacy TipTap document was emitted by the allow-list
 * renderer in `server/content-render.ts`. Neither path can put markup in this
 * column that the article stylesheet does not already have a rule for.
 *
 * `dangerouslySetInnerHTML` is the only way to render stored markup, and the
 * safety is upstream of it — not in this file, and never in the fact that a
 * rich-text editor produced the string.
 */
export function ArticleContent({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  if (!html) return null;

  return (
    <div
      className={className ? `article-content ${className}` : "article-content"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
