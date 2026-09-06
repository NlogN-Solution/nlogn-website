"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import type { Editor, EditorConfig } from "ckeditor5";
import { MediaPicker, type MediaItem } from "@/components/admin/media-picker";

/**
 * The long-form editor.
 *
 * CKEditor 5 is loaded from CKEditor's CDN by `useCKEditorCloud`, so no editor
 * build is bundled into this application and upgrading is a version string. It
 * is a browser control end to end — hence the client component, and hence the
 * loader below rather than an import: there is nothing here the server could
 * render, and pretending otherwise is what produces hydration mismatches.
 *
 * What it produces is HTML, which the server sanitises against an allow-list
 * before storing (`server/content-sanitize.ts`). The plugin list here is the
 * first of those two gates and the reason the second one rarely has anything to
 * do: a feature that is not loaded cannot be typed, pasted or configured into
 * the document. General HTML Support is deliberately absent — it exists to let
 * arbitrary markup through, which is the opposite of what this editor is for.
 *
 * The editing root is given the `article-content` class in `onReady`, so the
 * text being written is laid out by exactly the stylesheet that will lay out
 * the published page. That is the visual parity requirement, met structurally
 * rather than by keeping two sets of rules in step by hand.
 */

/** Pinned rather than floating: an editor that changes under you is a bug. */
const CKEDITOR_VERSION = "46.0.0";

/**
 * The licence key, from the environment.
 *
 * CKEditor 5 has required a key since v44, and the key is tied to a
 * *distribution channel*. The `GPL` key covers self-hosted use only: loading
 * the editor from CKEditor's CDN, as this does, is the "cloud" channel and is
 * rejected with `license-key-invalid-distribution-channel` — verified against
 * v46 rather than assumed. A cloud key is therefore not optional here, and the
 * free tier at https://portal.ckeditor.com issues one.
 *
 * NEXT_PUBLIC_ because the editor reads it in the browser. That also means it
 * reaches every visitor of the admin panel: a CKEditor licence key is a licence
 * identifier, not a credential, and nothing secret should ever be put here.
 */
const LICENSE_KEY = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY?.trim();

export type CkEditorHandle = { getData: () => string };

export function CkEditor({
  value,
  onChange,
  placeholder = "Start writing. Use Heading 2 for sections.",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const cloud = useCKEditorCloud({ version: CKEDITOR_VERSION });
  const [picking, setPicking] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const [words, setWords] = useState(0);

  /*
   * The initial document, frozen at mount.
   *
   * `CKEditor`'s `data` prop resets the document whenever it changes, which
   * would fight every keystroke and drop the caret to the top. The editor owns
   * its content once it is running; the form is told about changes through
   * `onChange` and never pushes them back.
   */
  const [initialData] = useState(value);

  /** Opens the site's own media library. See the toolbar plugin below. */
  const openMediaPicker = useCallback(() => setPicking(true), []);
  const openMediaPickerRef = useRef(openMediaPicker);
  openMediaPickerRef.current = openMediaPicker;

  const config = useMemo<EditorConfig | null>(() => {
    if (cloud.status !== "success") return null;

    const {
      ClassicEditor,
      Autoformat,
      BlockQuote,
      Bold,
      Code,
      CodeBlock,
      Essentials,
      FindAndReplace,
      Heading,
      HorizontalLine,
      Image,
      ImageCaption,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      Italic,
      Link,
      List,
      Paragraph,
      PasteFromOffice,
      Strikethrough,
      Table,
      TableCaption,
      TableColumnResize,
      TableToolbar,
      Underline,
      WordCount,
      ButtonView,
      Plugin,
    } = cloud.CKEditor;

    /**
     * The one custom control: insert an image from the existing media library.
     *
     * CKEditor's own upload adapters are deliberately not loaded. Uploading
     * through the editor would create a second store alongside Cloudinary and
     * the media library, and images inserted that way would be invisible to the
     * rest of the CMS. This button opens the same picker the cover-image field
     * uses, so every image on the site has one home.
     */
    class NlognMediaLibrary extends Plugin {
      static get pluginName() {
        return "NlognMediaLibrary" as const;
      }

      init() {
        const editor = this.editor;

        editor.ui.componentFactory.add("nlognMedia", () => {
          const button = new ButtonView();

          button.set({
            label: "Insert image from library",
            icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5A1.5 1.5 0 0 1 4 3h12a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 16 17H4a1.5 1.5 0 0 1-1.5-1.5v-11Zm1.5 0v8.4l3.3-3.1a1 1 0 0 1 1.35-.02l3.1 2.7 2.2-1.9a1 1 0 0 1 1.3 0l.75.64V4.5H4Zm9.25 3.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"/></svg>',
            tooltip: true,
          });

          button.on("execute", () => openMediaPickerRef.current());
          return button;
        });
      }
    }

    return {
      licenseKey: LICENSE_KEY || "GPL",
      editor: ClassicEditor,
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Autoformat,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        Code,
        Link,
        List,
        BlockQuote,
        HorizontalLine,
        CodeBlock,
        Image,
        ImageCaption,
        ImageStyle,
        ImageToolbar,
        ImageResize,
        ImageTextAlternative,
        Table,
        TableToolbar,
        TableCaption,
        TableColumnResize,
        PasteFromOffice,
        FindAndReplace,
        WordCount,
        NlognMediaLibrary,
      ],
      toolbar: {
        items: [
          "undo",
          "redo",
          "|",
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "code",
          "|",
          "link",
          "bulletedList",
          "numberedList",
          "|",
          "nlognMedia",
          "insertTable",
          "blockQuote",
          "codeBlock",
          "horizontalLine",
          "|",
          "findAndReplace",
        ],
        // Wraps onto a second row instead of hiding controls behind an overflow
        // menu, which on a narrow admin column is most of them.
        shouldNotGroupWhenFull: true,
      },
      heading: {
        // No H1: the page template owns it, and a second one on the page is
        // both a hierarchy lie and an SEO problem. The sanitiser enforces the
        // same rule for pasted content.
        options: [
          { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
          { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
          { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
        ],
      },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: "https://",
        decorators: {
          openInNewTab: {
            mode: "manual",
            label: "Open in a new tab",
            defaultValue: true,
            attributes: { target: "_blank", rel: "noopener noreferrer" },
          },
        },
      },
      image: {
        toolbar: [
          "imageStyle:inline",
          "imageStyle:alignLeft",
          "imageStyle:block",
          "imageStyle:alignRight",
          "|",
          "toggleImageCaption",
          "imageTextAlternative",
          "|",
          "resizeImage",
        ],
      },
      table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "toggleTableCaption"],
      },
      placeholder,
    } as unknown as EditorConfig;
  }, [cloud, placeholder]);

  // The bundle can fail to load — an offline laptop, a blocked CDN. Say so
  // rather than rendering an empty box that looks like a broken page.
  if (cloud.status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-[0.8125rem] text-red-700">
        The editor could not be loaded from CKEditor&apos;s CDN. Check your connection and reload —
        nothing you had already saved is affected.
      </div>
    );
  }

  if (cloud.status !== "success" || !config) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <div className="h-11 animate-pulse border-b border-line bg-canvas" />
        <div className="h-[30rem] animate-pulse bg-surface" />
      </div>
    );
  }

  const { ClassicEditor } = cloud.CKEditor;

  return (
    <div className="nlogn-ckeditor">
      {!LICENSE_KEY && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-900">
          <strong>No CKEditor licence key is set.</strong> The editor is loaded from CKEditor&apos;s
          CDN, and the free <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">GPL</code>{" "}
          key does not cover that distribution channel — CKEditor will report{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
            license-key-invalid-distribution-channel
          </code>{" "}
          and may stop accepting input. Get a key at{" "}
          <a
            href="https://portal.ckeditor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            portal.ckeditor.com
          </a>{" "}
          and set <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
            NEXT_PUBLIC_CKEDITOR_LICENSE_KEY
          </code>.
        </div>
      )}

      <CKEditor
        editor={ClassicEditor as never}
        config={config}
        data={initialData}
        onReady={(editor) => {
          editorRef.current = editor;

          /*
           * The editing surface is given the public article's own class, so
           * what the writer sees while typing is laid out by the stylesheet
           * that will lay out the published page. One set of rules, two places.
           */
          editor.editing.view.change((writer) => {
            writer.addClass("article-content", editor.editing.view.document.getRoot()!);
          });

          const wordCount = editor.plugins.has("WordCount")
            ? editor.plugins.get("WordCount")
            : null;
          if (wordCount) {
            setWords(wordCount.words);
            wordCount.on("update", (_event, stats: { words: number }) => setWords(stats.words));
          }
        }}
        onChange={(_event, editor) => onChange(editor.getData())}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-4 py-2 text-[0.75rem] text-muted">
        <span>
          {words.toLocaleString()} {words === 1 ? "word" : "words"}
        </span>
        <span>&asymp; {Math.max(1, Math.round(words / 200))} min read</span>
      </div>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        accept="IMAGE"
        folder="articles"
        onSelect={(media: MediaItem) => {
          setPicking(false);
          const editor = editorRef.current;
          if (!editor) return;

          // `insertImage` is the model-level command, so the image arrives as a
          // proper widget with caption, alt-text and resize handles attached —
          // exactly as if it had come from CKEditor's own insert flow.
          editor.execute("insertImage", {
            source: { src: media.secureUrl, alt: media.alt ?? "" },
          });
          editor.editing.view.focus();
        }}
      />
    </div>
  );
}
