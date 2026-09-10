"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Braces,
  Code,
  Columns3,
  Image as ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { MediaPicker, type MediaItem } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";

/**
 * The long-form editor.
 *
 * Tiptap (ProseMirror) rather than CKEditor, and the reason is licensing rather
 * than taste. CKEditor 5 has required a licence key since v44, that key is tied
 * to a *distribution channel* and to a list of `licensedHosts`, and a key that
 * does not match the page it is running on puts the editor into read-only mode
 * — an editor you cannot type in, with no error on screen saying why. The key
 * this project holds is issued for `nlogn.online`, so every local run of the
 * admin was silently uneditable. Tiptap is MIT, ships from npm, needs no key
 * and has no idea what host it is on.
 *
 * It is also entirely self-hosted: nothing is fetched from a CDN at runtime, so
 * the admin works offline and a blocked third-party domain cannot take the
 * editor with it.
 *
 * What it produces is HTML, which the server sanitises against an allow-list
 * before storing (`server/content-sanitize.ts`). The extension list here is the
 * first of those two gates and the reason the second rarely has anything to do:
 * a node that is not registered cannot be typed, pasted or configured into the
 * document.
 *
 * The editing surface is given the `article-content` class, so the text being
 * written is laid out by exactly the stylesheet that will lay out the published
 * page. That is the visual parity requirement, met structurally rather than by
 * keeping two sets of rules in step by hand.
 */

/** Words in a document, counted the way the server counts them. */
function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

/**
 * A URL typed into the link bar, made safe and absolute.
 *
 * Anything that is not http(s), mailto:, tel: or a site-relative path is
 * rejected outright — `javascript:` most of all. A bare domain gets https://,
 * because that is what somebody pasting `example.com` means.
 */
function normaliseHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^(?:https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // some other scheme — no
  return `https://${value}`;
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Start writing. Use Heading 2 for sections.",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  /*
   * The initial document, frozen at mount.
   *
   * Pushing `value` back into the editor on every render would fight each
   * keystroke and drop the caret to the top. The editor owns its content once
   * it is running; the form hears about changes through `onChange` and never
   * pushes them back.
   */
  const [initial] = useState(value);

  const editor = useEditor({
    // The admin renders on the server first. Building the ProseMirror view
    // during that pass is what produces the hydration mismatch Tiptap warns
    // about, so the view is created in an effect after mount instead.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // No H1: the page template owns it, and a second one on the page is
        // both a hierarchy lie and an SEO problem. The sanitiser enforces the
        // same rule for pasted content.
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
      /*
       * Images arrive from the site's own media library and nowhere else.
       * Tiptap's drag-and-drop upload is deliberately not wired up: uploading
       * through the editor would create a second store alongside Cloudinary and
       * the media library, and images inserted that way would be invisible to
       * the rest of the CMS.
       */
      Image.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class: "article-content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  if (!editor) {
    return (
      <div className="nlogn-editor">
        <div className="h-11 animate-pulse border-b border-line bg-canvas" />
        <div className="h-[30rem] animate-pulse bg-surface" />
      </div>
    );
  }

  return <EditorShell editor={editor} />;
}

/**
 * Everything that reads the editor, mounted only once there is an editor to
 * read — and that is load-bearing, not tidiness.
 *
 * `useEditorState` builds its snapshot store on *first* render and seeds it
 * with whatever `editor` was then. Under `immediatelyRender: false` — which
 * Next requires, since the ProseMirror view cannot be built during the server
 * pass — that first value is `null`, and the store keeps handing back that
 * stale snapshot until the first transaction fires. A toolbar that selects off
 * it therefore gets `null` forever on a document nobody has typed into yet,
 * which is exactly how the editor renders as a permanent grey skeleton.
 *
 * Splitting the component moves that first render to a point where the editor
 * already exists, so the very first snapshot is the real one. It also avoids
 * `shouldRerenderOnTransaction`, which Tiptap documents as legacy and intends
 * to remove.
 */
function EditorShell({ editor }: { editor: Editor }) {
  const [picking, setPicking] = useState(false);
  const [linkBar, setLinkBar] = useState<string | null>(null);
  const linkInput = useRef<HTMLInputElement>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      words: countWords(instance.getText()),
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      underline: instance.isActive("underline"),
      strike: instance.isActive("strike"),
      code: instance.isActive("code"),
      link: instance.isActive("link"),
      bulletList: instance.isActive("bulletList"),
      orderedList: instance.isActive("orderedList"),
      blockquote: instance.isActive("blockquote"),
      codeBlock: instance.isActive("codeBlock"),
      inTable: instance.isActive("table"),
      block: instance.isActive("heading", { level: 2 })
        ? "h2"
        : instance.isActive("heading", { level: 3 })
          ? "h3"
          : instance.isActive("heading", { level: 4 })
            ? "h4"
            : "p",
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
    }),
  });

  // The link bar is a text input that appears on demand; focusing it is the
  // whole point of opening it.
  useEffect(() => {
    if (linkBar !== null) linkInput.current?.focus();
  }, [linkBar]);

  const openLinkBar = useCallback(() => {
    setLinkBar(editor.getAttributes("link").href ?? "");
  }, [editor]);

  const applyLink = useCallback(() => {
    if (linkBar === null) return;
    const href = normaliseHref(linkBar);

    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }

    setLinkBar(null);
  }, [editor, linkBar]);

  return (
    <div className="nlogn-editor">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-canvas px-2 py-1.5">
        <ToolButton
          label="Undo"
          icon={<Undo2 className="size-4" />}
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolButton
          label="Redo"
          icon={<Redo2 className="size-4" />}
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        />

        <Divider />

        <select
          aria-label="Paragraph style"
          value={state.block}
          onChange={(event) => {
            const next = event.target.value;
            const chain = editor.chain().focus();
            if (next === "p") chain.setParagraph().run();
            else chain.setHeading({ level: Number(next.slice(1)) as 2 | 3 | 4 }).run();
          }}
          className="h-8 rounded-md border border-line bg-surface px-2 text-[0.8125rem] text-ink outline-none transition-colors focus:border-violet/50"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <Divider />

        <ToolButton
          label="Bold"
          icon={<Bold className="size-4" />}
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolButton
          label="Italic"
          icon={<Italic className="size-4" />}
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          label="Underline"
          icon={<UnderlineIcon className="size-4" />}
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolButton
          label="Strikethrough"
          icon={<Strikethrough className="size-4" />}
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolButton
          label="Inline code"
          icon={<Code className="size-4" />}
          active={state.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />

        <Divider />

        <ToolButton
          label="Link"
          icon={<Link2 className="size-4" />}
          active={state.link}
          onClick={openLinkBar}
        />
        <ToolButton
          label="Remove link"
          icon={<Link2Off className="size-4" />}
          disabled={!state.link}
          onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        />
        <ToolButton
          label="Bulleted list"
          icon={<List className="size-4" />}
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          label="Numbered list"
          icon={<ListOrdered className="size-4" />}
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <Divider />

        <ToolButton
          label="Insert image from library"
          icon={<ImageIcon className="size-4" />}
          onClick={() => setPicking(true)}
        />
        <ToolButton
          label="Insert table"
          icon={<TableIcon className="size-4" />}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        />
        <ToolButton
          label="Quote"
          icon={<Quote className="size-4" />}
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolButton
          label="Code block"
          icon={<Braces className="size-4" />}
          active={state.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolButton
          label="Horizontal rule"
          icon={<Minus className="size-4" />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </div>

      {/* Table controls, shown only with the caret inside a table. Five buttons
          that are dead most of the time are worse than five that appear when
          they mean something. */}
      {state.inTable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-violet-wash px-2 py-1.5">
          <span className="px-1.5 text-[0.75rem] font-medium text-violet-deep">Table</span>
          <ToolButton
            label="Add row below"
            icon={<Rows3 className="size-4" />}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          />
          <ToolButton
            label="Add column after"
            icon={<Columns3 className="size-4" />}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          />
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="h-8 rounded-md px-2 text-[0.75rem] font-medium text-ink-soft transition-colors hover:bg-surface"
          >
            Delete row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="h-8 rounded-md px-2 text-[0.75rem] font-medium text-ink-soft transition-colors hover:bg-surface"
          >
            Delete column
          </button>
          <ToolButton
            label="Delete table"
            icon={<Trash2 className="size-4" />}
            onClick={() => editor.chain().focus().deleteTable().run()}
          />
        </div>
      )}

      {/*
        The link bar, rather than `window.prompt`. A native dialog blocks the
        page, loses the selection on some browsers and cannot be styled; this is
        an ordinary input that keeps the document's selection intact behind it.
      */}
      {linkBar !== null && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas px-3 py-2">
          <input
            ref={linkInput}
            value={linkBar}
            onChange={(event) => setLinkBar(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") setLinkBar(null);
            }}
            placeholder="https://example.com — or leave empty to remove the link"
            className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-[0.8125rem] text-ink outline-none transition-colors focus:border-violet/50"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-8 rounded-md bg-ink px-3 text-[0.75rem] font-semibold text-white"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkBar(null)}
            className="h-8 rounded-md px-2 text-[0.75rem] font-medium text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-4 py-2 text-[0.75rem] text-muted">
        <span>
          {state.words.toLocaleString()} {state.words === 1 ? "word" : "words"}
        </span>
        <span>&asymp; {Math.max(1, Math.round(state.words / 200))} min read</span>
      </div>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        accept="IMAGE"
        folder="articles"
        onSelect={(media: MediaItem) => {
          setPicking(false);
          editor
            .chain()
            .focus()
            .setImage({ src: media.secureUrl, alt: media.alt ?? "" })
            .run();
        }}
      />
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-line" />;
}

function ToolButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-md transition-colors",
        "disabled:cursor-default disabled:opacity-35",
        active
          ? "bg-violet text-white"
          : "text-ink-soft hover:bg-surface hover:text-ink disabled:hover:bg-transparent",
      )}
    >
      {icon}
    </button>
  );
}
