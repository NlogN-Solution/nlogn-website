"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Trash2 } from "lucide-react";
import { api, qs, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { PageHeader } from "@/components/admin/shell";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  Panel,
  Pagination,
  SearchInput,
  Select,
  SkeletonRows,
  StatusBadge,
  Textarea,
  type PaginationMeta,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * The enquiry inbox.
 *
 * Contact form submissions, package enquiries and custom-quote requests all
 * arrive here, told apart by their source. Opening one marks it read, so the
 * unread count in the sidebar means "nobody has looked at this" rather than
 * "nobody clicked a button".
 */

type Message = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  service: string | null;
  budget: string | null;
  message: string;
  source: string;
  context: { packageName?: string | null; planSummary?: string | null } | null;
  status: string;
  isRead: boolean;
  notes: string | null;
  emailDelivered: boolean;
  createdAt: string;
};

type Listing = { items: Message[]; pagination: PaginationMeta; unread: number };

const SOURCES = [
  { value: "all", label: "All sources" },
  { value: "CONTACT_FORM", label: "Contact form" },
  { value: "PACKAGE_ENQUIRY", label: "Package enquiry" },
  { value: "CUSTOM_QUOTE", label: "Custom quote" },
  { value: "GROWTH_STACK", label: "Growth stack" },
  { value: "CHAT_WIDGET", label: "Chat widget" },
];

export function MessagesInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Message | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // No synchronous `setLoading(true)` here: the first render already starts in
  // the loading state, and a refetch keeps the current rows visible rather than
  // flashing a skeleton on every keystroke.
  const load = useCallback(async () => {
    try {
      const result = await api.get<Listing>(
        `/api/admin/messages${qs({ q, status, source, page, perPage: 20 })}`,
      );
      setData(result);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not load messages.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, status, source, page, toast]);

  useEffect(() => {
  // `load` is async: every setState in it runs in a promise continuation, not
  // synchronously in the effect body. The rule cannot see across the await, and
  // fetching on mount is exactly what this effect is for.
  // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const changeQ = (value: string) => {
    setQ(value);
    setPage(1);
  };
  const changeStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };
  const changeSource = (value: string) => {
    setSource(value);
    setPage(1);
  };

  const openMessage = useCallback(
    async (message: Message) => {
      setOpen(message);
      setNotes(message.notes ?? "");
      try {
        // The GET marks it read server-side.
        await api.get<Message>(`/api/admin/messages/${message.id}`);
        load();
        router.refresh();
      } catch {
        // Non-fatal: the panel is already showing the row we have.
      }
    },
    [load, router],
  );

  // Deep link from the dashboard: /admin/messages?open=<id>. The ref makes this
  // fire once for a given id rather than on every re-render of the list.
  const deepLinked = useRef<string | null>(null);
  useEffect(() => {
    const id = params.get("open");
    if (!id || !data || deepLinked.current === id) return;
    const found = data.items.find((m) => m.id === id);
    if (!found) return;
    deepLinked.current = id;
    // Opening the panel is the whole point of the deep link, and the ref above
    // makes this run once per id rather than on every render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void openMessage(found);
  }, [params, data, openMessage]);

  async function update(patch: Record<string, unknown>) {
    if (!open) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/messages/${open.id}`, patch);
      toast("Updated.", "success");
      load();
      router.refresh();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not update.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!open) return;
    setBusy(true);
    try {
      await api.del(`/api/admin/messages/${open.id}`);
      toast("Message deleted.", "success");
      setConfirming(false);
      setOpen(null);
      load();
      router.refresh();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not delete.", "error");
    } finally {
      setBusy(false);
    }
  }

  const interest = open?.context?.packageName || open?.context?.planSummary;

  return (
    <>
      <PageHeader
        title="Messages"
        description={
          data ? `${data.pagination.total} total · ${data.unread} unread` : "Enquiries from the website"
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <SearchInput value={q} onChange={changeQ} placeholder="Search name, email or message…" />
          <Select value={status} onChange={(e) => changeStatus(e.target.value)} aria-label="Status" className="w-32">
            <option value="all">All</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="REPLIED">Replied</option>
            <option value="ARCHIVED">Archived</option>
            <option value="SPAM">Spam</option>
          </Select>
          <Select value={source} onChange={(e) => changeSource(e.target.value)} aria-label="Source" className="w-40">
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        {loading && !data ? (
          <SkeletonRows rows={6} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Nothing here"
            body="Enquiries from the contact form and the pricing pages land in this inbox."
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.items.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => openMessage(message)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-canvas"
                  >
                    {!message.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-violet" aria-label="Unread" />
                    )}
                    <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <span
                        className={cn(
                          "block truncate text-[0.875rem] text-ink",
                          !message.isRead && "font-semibold",
                        )}
                      >
                        {message.name}
                        {message.company ? ` · ${message.company}` : ""}
                      </span>
                      <span className="block truncate text-[0.75rem] text-muted">
                        {message.message.slice(0, 90)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[0.6875rem] text-muted">
                      {message.source.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <StatusBadge status={message.status} />
                    <span className="hidden w-24 shrink-0 text-right text-[0.75rem] text-muted md:block">
                      {new Date(message.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
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
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.name ?? "Message"}
        description={open ? new Date(open.createdAt).toLocaleString("en-GB") : undefined}
        wide
      >
        {open && (
          <div className="space-y-5 p-5">
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {[
                ["Email", open.email],
                ["Company", open.company],
                ["Phone", open.phone],
                ["Service", open.service],
                ["Budget", open.budget],
                ["Source", open.source.replace(/_/g, " ").toLowerCase()],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex min-w-0 gap-2 text-[0.8125rem]">
                    <span className="w-20 shrink-0 text-muted">{label}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{value}</span>
                  </div>
                ))}
            </div>

            {interest && (
              <div className="rounded-lg border border-violet/20 bg-violet-wash px-4 py-3">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-violet-deep">
                  Interested in
                </p>
                <p className="mt-1 text-[0.875rem] text-ink">{interest}</p>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
                Message
              </p>
              <div className="whitespace-pre-wrap rounded-lg border border-line bg-canvas px-4 py-3 text-[0.875rem] leading-relaxed text-ink">
                {open.message}
              </div>
            </div>

            {!open.emailDelivered && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[0.75rem] text-amber-800">
                The notification email for this enquiry was not delivered. It is stored here safely,
                but check the SMTP settings on the System status page.
              </p>
            )}

            <Field label="Internal notes" htmlFor="notes" hint="Only visible in this dashboard.">
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                icon={<Mail className="size-4" />}
                onClick={() => window.open(`mailto:${open.email}?subject=Re: your enquiry`, "_blank")}
              >
                Reply by email
              </Button>
              <Button loading={busy} onClick={() => update({ notes, status: "REPLIED" })}>
                Save & mark replied
              </Button>
              <Button onClick={() => update({ notes, status: "ARCHIVED" })}>Archive</Button>
              <Button onClick={() => update({ status: "SPAM" })}>Spam</Button>
              <Button
                variant="danger"
                icon={<Trash2 className="size-4" />}
                onClick={() => setConfirming(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={remove}
        loading={busy}
        title="Delete this message?"
        body="The enquiry and any notes on it will be removed permanently. Archiving keeps it out of the way without losing it."
      />
    </>
  );
}
