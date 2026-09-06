/**
 * Renders TipTap's JSON document to HTML.
 *
 * This is a strict allow-list renderer rather than a sanitiser: it walks the
 * document and emits markup only for node and mark types it knows about,
 * escaping every piece of text and every attribute value on the way out. A
 * document that somehow contained a `<script>` node type would produce nothing,
 * because there is no branch that could emit one. Sanitising stored HTML is the
 * other way round — deny-listing what an attacker sends — and it is the weaker
 * of the two.
 */

export type EditorNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type EditorDoc = { type: "doc"; content?: EditorNode[] };

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s), mailto and same-site paths survive. Blocks `javascript:` URLs. */
function safeUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return null;
}

const MARK_TAGS: Record<string, string> = {
  bold: "strong",
  strong: "strong",
  italic: "em",
  em: "em",
  underline: "u",
  strike: "s",
  code: "code",
};

function applyMarks(html: string, marks: EditorNode["marks"]) {
  if (!marks?.length) return html;
  let out = html;
  for (const mark of marks) {
    if (mark.type === "link") {
      const href = safeUrl(mark.attrs?.href);
      if (!href) continue;
      const external = /^https?:/i.test(href);
      out = `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""}>${out}</a>`;
      continue;
    }
    const tag = MARK_TAGS[mark.type];
    if (tag) out = `<${tag}>${out}</${tag}>`;
  }
  return out;
}

/**
 * The id a heading gets, so the table of contents has something to link to.
 *
 * `public-content.ts` reads these back out of the rendered HTML rather than
 * recomputing them, which is what keeps the two in step — including the `-2`
 * suffix two identically-worded headings end up with.
 */
function headingSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** Plain text of a node's subtree, for heading ids. */
function nodeText(node: EditorNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(nodeText).join("");
}

function renderNodes(nodes: EditorNode[] | undefined, seen?: Map<string, number>): string {
  if (!nodes?.length) return "";
  return nodes.map((node) => renderNode(node, seen)).join("");
}

function renderNode(node: EditorNode, seen?: Map<string, number>): string {
  switch (node.type) {
    case "text":
      return applyMarks(esc(node.text), node.marks);

    case "paragraph": {
      const inner = renderNodes(node.content, seen);
      return inner ? `<p>${inner}</p>` : "";
    }

    case "heading": {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2));
      const base = headingSlug(nodeText(node));
      if (!base) return `<h${level}>${renderNodes(node.content, seen)}</h${level}>`;

      // Two headings with the same words would otherwise share an id, and the
      // second entry in the table of contents would scroll to the first.
      const count = (seen?.get(base) ?? 0) + 1;
      seen?.set(base, count);
      const id = count > 1 ? `${base}-${count}` : base;

      return `<h${level} id="${esc(id)}">${renderNodes(node.content, seen)}</h${level}>`;
    }

    case "bulletList":
      return `<ul>${renderNodes(node.content, seen)}</ul>`;
    case "orderedList":
      return `<ol>${renderNodes(node.content, seen)}</ol>`;
    case "listItem":
      return `<li>${renderNodes(node.content, seen)}</li>`;

    case "blockquote":
      return `<blockquote>${renderNodes(node.content, seen)}</blockquote>`;

    case "codeBlock":
      return `<pre><code>${esc(node.content?.map((c) => c.text ?? "").join("") ?? "")}</code></pre>`;

    case "horizontalRule":
      return "<hr>";

    case "hardBreak":
      return "<br>";

    case "image": {
      const src = safeUrl(node.attrs?.src);
      if (!src) return "";
      const alt = esc(node.attrs?.alt ?? "");
      const caption = node.attrs?.title ? esc(node.attrs.title) : "";
      const img = `<img src="${esc(src)}" alt="${alt}" loading="lazy">`;
      return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : img;
    }

    case "video": {
      const src = safeUrl(node.attrs?.src);
      if (!src) return "";
      return `<video src="${esc(src)}" controls playsinline preload="metadata"></video>`;
    }

    case "callout": {
      const tone = ["info", "warn", "success"].includes(String(node.attrs?.tone))
        ? String(node.attrs?.tone)
        : "info";
      return `<aside class="callout callout--${tone}">${renderNodes(node.content, seen)}</aside>`;
    }

    case "table":
      return `<div class="table-scroll"><table>${renderNodes(node.content, seen)}</table></div>`;
    case "tableRow":
      return `<tr>${renderNodes(node.content, seen)}</tr>`;
    case "tableHeader":
      return `<th>${renderNodes(node.content, seen)}</th>`;
    case "tableCell":
      return `<td>${renderNodes(node.content, seen)}</td>`;

    case "doc":
      return renderNodes(node.content, seen);

    default:
      // Unknown node: render its children if it has any, drop it otherwise.
      return renderNodes(node.content, seen);
  }
}

export function renderEditorDoc(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  return renderNodes((doc as EditorDoc).content, new Map());
}

/** Plain text, for excerpts, reading time and search. */
export function editorPlainText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const parts: string[] = [];
  const walk = (nodes: EditorNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === "text" && node.text) parts.push(node.text);
      if (node.content) walk(node.content);
      if (["paragraph", "heading", "listItem", "blockquote"].includes(node.type ?? "")) {
        parts.push("\n");
      }
    }
  };
  walk((doc as EditorDoc).content);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** ~200 words a minute, floored at one. */
export function readingMinutes(doc: unknown) {
  const words = editorPlainText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
