"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { FileText, Film, Upload } from "lucide-react";
import { api, qs, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { Button, EmptyState, Modal, Select, SearchInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * The media library, used both as a page and as a picker inside editors.
 *
 * Uploads go straight to the admin API, which authenticates, sniffs the file's
 * real type and forwards it to Cloudinary. The browser never talks to
 * Cloudinary directly, so there is no unsigned preset to abuse.
 */

export type MediaItem = {
  id: string;
  publicId: string;
  secureUrl: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER";
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number;
  originalName: string | null;
  folder: string | null;
  alt: string | null;
  caption: string | null;
  createdAt: string;
};

type Listing = {
  items: MediaItem[];
  pagination: { page: number; totalPages: number; total: number; hasNext: boolean };
};

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  if (item.type === "IMAGE") {
    return (
      <NextImage
        src={item.secureUrl}
        alt={item.alt ?? item.originalName ?? ""}
        fill
        sizes="200px"
        className={cn("object-cover", className)}
        unoptimized
      />
    );
  }
  return (
    <span className="grid size-full place-items-center bg-canvas text-muted">
      {item.type === "VIDEO" ? <Film className="size-6" /> : <FileText className="size-6" />}
    </span>
  );
}

/** Shared upload control. Reports progress and per-file failures individually. */
export function UploadButton({
  folder,
  onUploaded,
  accept,
  label = "Upload",
}: {
  folder: string;
  onUploaded: (item: MediaItem) => void;
  accept?: "IMAGE" | "VIDEO";
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const acceptAttr =
    accept === "IMAGE"
      ? "image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
      : accept === "VIDEO"
        ? "video/mp4,video/webm,video/quicktime"
        : "image/*,video/mp4,video/webm,video/quicktime,application/pdf";

  const send = useCallback(
    async (files: FileList) => {
      setBusy(true);
      let ok = 0;
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", folder);
        try {
          const media = await api.upload<MediaItem>("/api/admin/media", form);
          onUploaded(media);
          ok += 1;
        } catch (error) {
          toast(
            error instanceof ApiError ? `${file.name}: ${error.message}` : `${file.name} failed.`,
            "error",
          );
        }
      }
      if (ok) toast(`Uploaded ${ok} file${ok === 1 ? "" : "s"}.`, "success");
      setBusy(false);
      if (input.current) input.current.value = "";
    },
    [folder, onUploaded, toast],
  );

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => e.target.files?.length && send(e.target.files)}
      />
      <Button
        variant="primary"
        size="sm"
        loading={busy}
        icon={<Upload className="size-4" />}
        onClick={() => input.current?.click()}
      >
        {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  accept,
  folder = "general",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  accept?: "IMAGE" | "VIDEO";
  folder?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState(accept ?? "all");
  const toast = useToast();

  // No synchronous `setLoading(true)` here: the first render already starts in
  // the loading state, and a refetch keeps the current rows visible rather than
  // flashing a skeleton on every keystroke.
  const load = useCallback(async () => {
    try {
      const data = await api.get<Listing>(
        `/api/admin/media${qs({ q, type: type === "all" ? undefined : type, perPage: 40 })}`,
      );
      setItems(data.items);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not load the library.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, type, toast]);

  useEffect(() => {
  // `load` is async: every setState in it runs in a promise continuation, not
  // synchronously in the effect body. The rule cannot see across the await, and
  // fetching on mount is exactly what this effect is for.
  // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load();
  }, [open, load]);

  return (
    <Modal open={open} onClose={onClose} title="Media library" wide>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search files…" />
        {!accept && (
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by type"
            className="w-32"
          >
            <option value="all">All types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="DOCUMENT">Documents</option>
          </Select>
        )}
        <UploadButton
          folder={folder}
          accept={accept}
          onUploaded={(item) => setItems((prev) => [item, ...prev])}
        />
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-canvas" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            body="Upload an image or video and it will appear in the library, ready to drop into any piece of content."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group w-full overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors hover:border-violet/50"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden bg-canvas">
                    <MediaThumb item={item} />
                  </span>
                  <span className="block truncate px-2.5 py-2 text-[0.75rem] text-ink-soft">
                    {item.originalName ?? item.publicId}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/** A single image slot on a form — cover image, hero, OG image, thumbnail. */
export function ImageField({
  value,
  onChange,
  folder = "general",
  label = "Image",
}: {
  value: MediaItem | null;
  onChange: (item: MediaItem | null) => void;
  folder?: string;
  label?: string;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <div>
      {value ? (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="relative aspect-[16/9] bg-canvas">
            <MediaThumb item={value} />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="min-w-0 truncate text-[0.75rem] text-muted">
              {value.originalName ?? value.publicId}
            </span>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => setPicking(true)}>
                Change
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-canvas px-4 py-8 text-center transition-colors hover:border-violet/50"
        >
          <Upload className="size-5 text-muted" aria-hidden />
          <span className="text-[0.8125rem] font-medium text-ink">Choose {label.toLowerCase()}</span>
          <span className="text-[0.75rem] text-muted">Pick from the library or upload a new file</span>
        </button>
      )}

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        accept="IMAGE"
        folder={folder}
        onSelect={(item) => {
          onChange(item);
          setPicking(false);
        }}
      />
    </div>
  );
}
