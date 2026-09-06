"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Check,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";

/**
 * Long-form editor.
 *
 * Content is stored as TipTap's JSON document, not as HTML. The server renders
 * it through an allow-list (`server/content-render.ts`), so what reaches a
 * visitor's browser is markup this codebase generated — never a string an
 * editor's clipboard happened to contain.
 *
 * The writing surface carries `.prose-admin`, which mirrors the published
 * article's hierarchy a step down in scale. A heading has to *look* like a
 * heading while it is being typed, or the person writing has no idea what the
 * page will do with it until they publish and go and look.
 */

/* ── toolbar pieces ──────────────────────────────────────────────────────── */

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "bg-ink text-white"
          : "text-ink-soft hover:bg-canvas-2 hover:text-ink disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />;
}

/**
 * The block picker.
 *
 * Buttons for every level would be five more icons that all look alike. A
 * select says what the current block *is*, which is the question somebody
 * actually has when the cursor is sitting in an unfamiliar paragraph.
 */
const BLOCKS = [
  { value: "paragraph", label: "Paragraph", icon: Pilcrow },
  { value: "h2", label: "Heading 2", icon: Heading2 },
  { value: "h3", label: "Heading 3", icon: Heading3 },
  { value: "h4", label: "Heading 4", icon: Heading4 },
] as const;

function BlockSelect({ editor }: { editor: Editor }) {
  const current = BLOCKS.find((b) =>
    b.value === "paragraph"
      ? editor.isActive("paragraph")
      : editor.isActive("heading", { level: Number(b.value.slice(1)) }),
  );

  return (
    <label className="relative shrink-0">
      <span className="sr-only">Block type</span>
      <select
        value={current?.value ?? "paragraph"}
        onChange={(e) => {
          const next = e.target.value;
          const chain = editor.chain().focus();
          if (next === "paragraph") chain.setParagraph().run();
          else chain.setHeading({ level: Number(next.slice(1)) as 2 | 3 | 4 }).run();
        }}
        className="h-8 w-[7.5rem] cursor-pointer appearance-none rounded-md border border-line bg-surface pl-2.5 pr-6 text-[0.8125rem] font-medium text-ink outline-none transition-colors hover:bg-canvas-2 focus-visible:border-violet/50"
      >
        {BLOCKS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.5rem] text-muted"
      >
        ▼
      </span>
    </label>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onEditLink,
}: {
  editor: Editor;
  onPickImage: () => void;
  onEditLink: () => void;
}) {
  return (
    // Sticky: a long post scrolls the toolbar off the screen otherwise, and
    // formatting the last paragraph means scrolling back to the top for it.
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-canvas/95 px-2 py-1.5 backdrop-blur-sm">
      <BlockSelect editor={editor} />

      <Divider />

      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={onEditLink}>
        <Link2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Remove link"
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
      >
        <Link2Off className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Insert image" onClick={onPickImage}>
        <ImagePlus className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

/**
 * Link entry.
 *
 * `window.prompt` blocks the tab, cannot be styled, and on some browsers is
 * suppressed outright — a bar under the toolbar is the same two keystrokes and
 * always there.
 */
function LinkBar({
  initial,
  onApply,
  onCancel,
}: {
  initial: string;
  onApply: (href: string) => void;
  onCancel: () => void;
}) {
  const [href, setHref] = useState(initial || "https://");

  return (
    <div className="flex items-center gap-2 border-b border-line bg-violet-wash px-2 py-1.5">
      <input
        autoFocus
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onApply(href.trim());
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder="https://example.com"
        aria-label="Link URL"
        className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-[0.8125rem] text-ink outline-none focus-visible:border-violet/60"
      />
      <ToolbarButton label="Apply link" onClick={() => onApply(href.trim())}>
        <Check className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Cancel" onClick={onCancel}>
        <X className="size-4" />
      </ToolbarButton>
    </div>
  );
}

/* ── the editor ──────────────────────────────────────────────────────────── */

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
}: {
  value: unknown;
  onChange: (doc: unknown) => void;
  placeholder?: string;
}) {
  const [picking, setPicking] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [words, setWords] = useState(0);

  const countWords = useCallback((editor: Editor) => {
    const text = editor.getText({ blockSeparator: " " }).trim();
    setWords(text ? text.split(/\s+/).length : 0);
  }, []);

  const editor = useEditor({
    // Rendering the editor on the server would mismatch on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: (value as never) ?? undefined,
    onCreate: ({ editor: e }) => countWords(e),
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON());
      countWords(e);
    },
    editorProps: {
      attributes: {
        // The measure matters: prose set the full width of an admin column is
        // hard to read and harder to judge, so the writing surface holds to
        // roughly the same line length the published article uses.
        class: "prose-admin mx-auto min-h-[28rem] w-full max-w-[46rem] px-6 py-6 outline-none",
      },
    },
  });

  // Replace the document only when the incoming value is genuinely different,
  // or every keystroke would round-trip and put the cursor back at the start.
  useEffect(() => {
    if (!editor || !value) return;
    const current = JSON.stringify(editor.getJSON());
    if (current !== JSON.stringify(value)) {
      editor.commands.setContent(value as never, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <div className="h-11 animate-pulse border-b border-line bg-canvas" />
        <div className="h-[28rem] animate-pulse bg-surface" />
      </div>
    );
  }

  const applyLink = (href: string) => {
    setLinking(null);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!href || href === "https://") chain.unsetLink().run();
    else chain.setLink({ href }).run();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface focus-within:border-violet/50">
      <Toolbar
        editor={editor}
        onPickImage={() => setPicking(true)}
        onEditLink={() => setLinking((editor.getAttributes("link").href as string) ?? "")}
      />

      {linking !== null && (
        <LinkBar initial={linking} onApply={applyLink} onCancel={() => setLinking(null)} />
      )}

      <EditorContent editor={editor} />

      {/* Length is the one thing a writer keeps checking and the one thing the
          form could never tell them until it was saved. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-4 py-2 text-[0.75rem] text-muted">
        <span>
          {words.toLocaleString()} {words === 1 ? "word" : "words"}
        </span>
        <span>≈ {Math.max(1, Math.round(words / 200))} min read</span>
      </div>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        accept="IMAGE"
        onSelect={(media) => {
          editor.chain().focus().setImage({ src: media.secureUrl, alt: media.alt ?? "" }).run();
          setPicking(false);
        }}
      />
    </div>
  );
}
