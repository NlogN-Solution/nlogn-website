import sanitizeHtml from "sanitize-html";
import { addHeadingIds } from "@/server/heading-slug";

/**
 * The gate every piece of CKEditor HTML passes through before it is stored.
 *
 * The rule is the same one `content-render.ts` follows for TipTap documents:
 * only markup this codebase has decided to allow ever reaches a reader. The
 * mechanism differs because the input does — a document tree can be walked and
 * re-emitted, whereas HTML has to be parsed and filtered — so this is an
 * allow-list over a real HTML parser rather than a hand-rolled one. Everything
 * not named below is removed.
 *
 * Sanitising happens on the way **in**, not on the way out. The database then
 * holds only markup that has already been through this, and the public page can
 * render `contentHtml` directly — which is what makes the TipTap and CKEditor
 * paths interchangeable downstream. That is not a reason to trust the column:
 * anything that reaches a reader was written by this function or by the TipTap
 * renderer, and nothing else has ever been given the chance.
 *
 * CKEditor being the source is explicitly *not* the reason any of this is safe.
 * The editor is a browser control; its output is a request body like any other.
 */

/** Percentages only — this is the one thing image resizing needs to persist. */
const WIDTH_PERCENT = [/^\d{1,3}(?:\.\d+)?%$/];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br",
    "h2", "h3", "h4",
    "strong", "em", "u", "s", "code",
    "a",
    "ul", "ol", "li",
    "blockquote",
    "figure", "figcaption", "img",
    "hr",
    "pre",
    "table", "thead", "tbody", "tr", "th", "td",
  ],

  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "width", "height", "loading"],
    // Headings carry the anchor a table of contents links to.
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    // CKEditor wraps images and tables in a figure and marks which it is.
    figure: ["class", "style"],
    code: ["class"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
  },

  allowedClasses: {
    figure: ["image", "image_resized", "image-style-*", "table", "media"],
    // Whatever the code block's language was, for highlighting later.
    code: ["language-*"],
  },

  allowedStyles: {
    figure: { width: WIDTH_PERCENT },
  },

  // No `javascript:`, no `data:`. Relative paths stay allowed so an image from
  // the site's own /public directory still works.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,

  // Dropped with their contents rather than unwrapped: the text inside a
  // <script> or <style> is code, and unwrapping it would paste it into the
  // article as prose.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe"],

  transformTags: {
    // The page template owns the <h1>. Pasted documents are full of them, and
    // a second one on the page is both an SEO problem and a hierarchy lie —
    // so they are demoted rather than dropped, keeping the author's structure.
    h1: "h2",
    h5: "h4",
    h6: "h4",
    // Presentational tags from pasted Word and Google Docs markup, mapped onto
    // the semantic equivalents the article stylesheet knows about.
    i: "em",
    strike: "s",
    del: "s",
    ins: "u",

    /*
     * `<b>` is not simply `<strong>`.
     *
     * Google Docs wraps an entire copied selection in
     * `<b id="docs-internal-guid-…" style="font-weight:normal">`, which is a
     * marker, not emphasis. Mapping that to `<strong>` sets the whole article
     * in bold — so a `<b>` that declares itself non-bold, or carries the Docs
     * marker, is unwrapped instead. `span` is not on the allow-list, so
     * returning it drops the tag and keeps the text inside.
     */
    b: (_tagName, attribs) => {
      const isDocsWrapper =
        /^docs-internal-guid/.test(attribs.id ?? "") ||
        /font-weight\s*:\s*normal/i.test(attribs.style ?? "");

      return { tagName: isDocsWrapper ? "span" : "strong", attribs: {} };
    },

    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);

      return {
        tagName,
        attribs: {
          ...attribs,
          // Only outbound links open away from the site; an internal one
          // opening a new tab is an annoyance, not a feature.
          ...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : { target: "", rel: "" }),
        },
      };
    },

    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        alt: attribs.alt ?? "",
        // Articles are long and image-heavy; none of them are above the fold.
        loading: "lazy",
      },
    }),
  },

  // Drops the empty shells pasted documents are full of — a link with no text,
  // a stray bullet, a quote containing nothing. An empty <p> is deliberately
  // kept: that is how CKEditor records a blank line the author left in.
  exclusiveFilter: (frame) =>
    ["a", "li", "blockquote"].includes(frame.tag) && !frame.text.trim() && !frame.mediaChildren.length,
};

/**
 * Two cosmetic passes over already-sanitised markup.
 *
 * The link transform writes `target=""`/`rel=""` on internal links to clear
 * whatever a pasted document set; those blanks are noise in the stored HTML.
 * And an anchor whose href was rejected — a `javascript:` URL, say — is left
 * behind with no href at all, which would render as link-coloured text that
 * does nothing. It is unwrapped to the plain text it should have been.
 */
function tidy(html: string) {
  return html
    .replace(/\s(?:target|rel)=""/g, "")
    .replace(/<a>([\s\S]*?)<\/a>/g, "$1");
}

/**
 * Sanitises a CKEditor document and stamps ids onto its headings.
 *
 * Returns an empty string for a document with no words and no media, so "the
 * author cleared the body" and "the author left one empty paragraph" are the
 * same thing to everything downstream.
 */
export function sanitizeArticleHtml(dirty: unknown): string {
  if (typeof dirty !== "string" || !dirty.trim()) return "";

  const clean = tidy(sanitizeHtml(dirty, OPTIONS));

  const hasWords = htmlToPlainText(clean).length > 0;
  const hasMedia = /<(?:img|table|hr)\b/.test(clean);
  if (!hasWords && !hasMedia) return "";

  return addHeadingIds(clean);
}

/**
 * The words a reader actually sees.
 *
 * Tag names, attribute values, URLs and alt text are all excluded — counting
 * them would make a heavily linked article read as longer than it is. Uses the
 * same sanitiser with every tag removed, so entities decode correctly instead
 * of `&amp;` being counted as a word.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  const text = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    // Block-level tags become spaces rather than nothing, so the last word of a
    // paragraph does not fuse with the first word of the next.
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  });

  return text.replace(/\s+/g, " ").trim();
}

/** ~200 words a minute, floored at one. Matches the TipTap path's figure. */
export function readingMinutesFromHtml(html: string): number {
  const words = htmlToPlainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** The opening lines, for an excerpt the author did not write themselves. */
export function excerptFromHtml(html: string, length = 260): string {
  const text = htmlToPlainText(html);
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}
