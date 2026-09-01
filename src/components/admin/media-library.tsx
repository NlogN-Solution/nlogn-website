"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { api, qs, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import {
  formatBytes,
  MediaThumb,
  UploadButton,
  type MediaItem,
} from "@/components/admin/media-picker";
import { PageHeader } from "@/components/admin/shell";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Panel,
  Pagination,
  SearchInput,
  Select,
  type PaginationMeta,
} from "@/components/admin/ui";
import { MEDIA_FOLDERS } from "@/config/media";

type Listing = { items: MediaItem[]; pagination: PaginationMeta };
type References = { blogs: number; insights: number; caseStudies: number; total: number };

export function MediaLibrary({
  stats,
}: {
  stats: { total: number; totalBytes: number; byType: { type: string; count: number; bytes: number }[] };
}) {
  const toast = useToast();
  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [folder, setFolder] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [references, setReferences] = useState<References | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // No synchronous `setLoading(true)` here: the first render already starts in
  // the loading state, and a refetch keeps the current rows visible rather than
  // flashing a skeleton on every keystroke.
  const load = useCallback(async () => {
    try {
      const result = await api.get<Listing>(
        `/api/admin/media${qs({ q, type: type === "all" ? undefined : type, folder: folder === "all" ? undefined : folder, page, perPage: 24 })}`,
      );
      setData(result);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not load the library.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, type, folder, page, toast]);

  useEffect(() => {
  // `load` is async: every setState in it runs in a promise continuation, not
  // synchronously in the effect body. The rule cannot see across the await, and
  // fetching on mount is exactly what this effect is for.
  // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Changing a filter resets to page one in the setter, not in an effect.
  const changeQ = (value: string) => {
    setQ(value);
    setPage(1);
  };
  const changeType = (value: string) => {
    setType(value);
    setPage(1);
  };
  const changeFolder = (value: string) => {
    setFolder(value);
    setPage(1);
  };

  const openDetail = useCallback(
    async (item: MediaItem) => {
      setSelected(item);
      setAlt(item.alt ?? "");
      setCaption(item.caption ?? "");
      setReferences(null);
      try {
        const detail = await api.get<{ media: MediaItem; references: References }>(
          `/api/admin/media/${item.id}`,
        );
        setReferences(detail.references);
      } catch {
        // Reference counting is advisory; the panel still works without it.
      }
    },
    [],
  );

  async function saveMeta() {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/media/${selected.id}`, { alt, caption });
      toast("Saved.", "success");
      load();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not save.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(force = false) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.del(`/api/admin/media/${selected.id}${force ? "?force=true" : ""}`);
      toast("File deleted.", "success");
      setConfirming(false);
      setSelected(null);
      load();
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        setConfirming(true);
        toast(error.message, "error");
      } else {
        toast(error instanceof ApiError ? error.message : "Could not delete that.", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Media library"
        description={`${stats.total} file${stats.total === 1 ? "" : "s"} · ${formatBytes(stats.totalBytes)} on Cloudinary`}
        action={<UploadButton folder="general" onUploaded={() => load()} label="Upload files" />}
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <SearchInput value={q} onChange={changeQ} placeholder="Search files…" />
          <Select value={type} onChange={(e) => changeType(e.target.value)} aria-label="Type" className="w-32">
            <option value="all">All types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="DOCUMENT">Documents</option>
          </Select>
          <Select value={folder} onChange={(e) => changeFolder(e.target.value)} aria-label="Folder" className="w-36">
            <option value="all">All folders</option>
            {MEDIA_FOLDERS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>

        {loading && !data ? (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-canvas" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Nothing in the library"
            body="Upload images and videos here once, then reuse them across blogs, insights and case studies."
          />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    className="w-full overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors hover:border-violet/50"
                  >
                    <span className="relative block aspect-square overflow-hidden bg-canvas">
                      <MediaThumb item={item} />
                    </span>
                    <span className="block truncate px-2 py-1.5 text-[0.6875rem] text-muted">
                      {item.originalName ?? item.publicId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Pagination meta={data.pagination} onPage={setPage} />
          </>
        )}
      </Panel>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.originalName ?? "File"}
        description={
          selected
            ? `${selected.type.toLowerCase()} · ${formatBytes(selected.bytes)}${selected.width ? ` · ${selected.width}×${selected.height}` : ""}`
            : undefined
        }
        wide
      >
        {selected && (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-canvas">
              <MediaThumb item={selected} />
            </div>

            <div className="min-w-0 space-y-4">
              <Field label="Alt text" htmlFor="alt" hint="Describes the image for screen readers and search.">
                <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
              </Field>
              <Field label="Caption" htmlFor="caption">
                <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
              </Field>

              <div>
                <p className="mb-1.5 text-[0.8125rem] font-medium text-ink">URL</p>
                <div className="flex min-w-0 gap-2">
                  <Input readOnly value={selected.secureUrl} className="font-mono text-[0.6875rem]" />
                  <Button
                    size="sm"
                    icon={<Copy className="size-4" />}
                    onClick={() => {
                      navigator.clipboard.writeText(selected.secureUrl);
                      toast("URL copied.", "success");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {references && (
                <p className="text-[0.75rem] leading-relaxed text-muted">
                  {references.total === 0
                    ? "Not used by any content."
                    : `Used by ${references.total} item${references.total === 1 ? "" : "s"}: ${references.blogs} blog, ${references.insights} insight, ${references.caseStudies} case study.`}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="primary" loading={busy} onClick={saveMeta}>
                  Save
                </Button>
                <Button
                  variant="danger"
                  icon={<Trash2 className="size-4" />}
                  onClick={() => remove(false)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => remove(true)}
        loading={busy}
        title="This file is in use"
        body={
          <>
            {references
              ? `It is referenced by ${references.total} published item${references.total === 1 ? "" : "s"}. `
              : ""}
            Deleting it will leave those pages without an image. This cannot be undone.
          </>
        }
        confirmLabel="Delete anyway"
      />
    </>
  );
}
