"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
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
 */

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
        active ? "bg-ink text-white" : "text-ink-soft hover:bg-canvas hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-canvas px-2 py-1.5">
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
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-line" />

      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-line" />

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
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-line" />

      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const href = window.prompt("Link URL", previous ?? "https://");
          if (href === null) return;
          if (href === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }}
      >
        <Link2 className="size-4" />
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

      <span className="mx-1 h-5 w-px bg-line" />

      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

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
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose-admin min-h-[24rem] max-w-none px-4 py-4 text-[0.9375rem] leading-relaxed text-ink outline-none",
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
        <div className="h-[24rem] animate-pulse bg-surface" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface focus-within:border-violet/50">
      <Toolbar editor={editor} onPickImage={() => setPicking(true)} />
      <EditorContent editor={editor} />

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
