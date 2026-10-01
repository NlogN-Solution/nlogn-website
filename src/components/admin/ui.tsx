"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The admin design system.
 *
 * Same tokens as the public site, spent differently: denser spacing, smaller
 * type, no entrance animations. A marketing page is trying to hold attention;
 * this is trying to get out of the way of somebody doing twenty edits in a row.
 */

/* ── surfaces ────────────────────────────────────────────────────────────── */

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface", className)}>{children}</div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {description && <p className="mt-1 text-[0.8125rem] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── buttons ─────────────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-violet disabled:hover:bg-ink",
  secondary: "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-canvas",
  ghost: "text-ink-soft hover:bg-canvas hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  icon,
  className,
  children,
  ...props
}: {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[0.8125rem]" : "h-9 px-4 text-sm",
        buttonStyles[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/* ── form fields ─────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.8125rem] font-medium text-ink"
      >
        {label}
        {required && <span className="ml-1 text-violet">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[0.75rem] text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-violet/60 disabled:bg-canvas disabled:text-muted";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "appearance-none pr-8", props.className)} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 grid h-5 w-9 shrink-0 place-items-start rounded-full p-0.5 transition-colors",
          checked ? "bg-violet" : "bg-line",
        )}
      >
        <span
          className={cn(
            "block size-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[0.75rem] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/* ── status ──────────────────────────────────────────────────────────────── */

const statusTone: Record<string, string> = {
  PUBLISHED: "border-emerald-600/25 bg-emerald-500/10 text-emerald-700",
  DRAFT: "border-amber-600/25 bg-amber-500/10 text-amber-700",
  ARCHIVED: "border-line bg-canvas text-muted",
  NEW: "border-violet/30 bg-violet-wash text-violet-deep",
  READ: "border-line bg-canvas text-ink-soft",
  REPLIED: "border-emerald-600/25 bg-emerald-500/10 text-emerald-700",
  SPAM: "border-red-500/25 bg-red-500/10 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide",
        statusTone[status] ?? "border-line bg-canvas text-muted",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

/* ── search ──────────────────────────────────────────────────────────────── */

/** Debounced so typing a query is one request, not one per keystroke. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  delay = 300,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [local, setLocal] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => onChange(local), delay);
    return () => clearTimeout(timer);
  }, [local, delay, onChange]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, "pl-9")}
      />
    </div>
  );
}

/* ── pagination ──────────────────────────────────────────────────────────── */

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage: (page: number) => void;
}) {
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.perPage + 1;
  const to = Math.min(meta.total, meta.page * meta.perPage);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-[0.8125rem] text-muted">
        {from}–{to} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!meta.hasPrev} onClick={() => onPage(meta.page - 1)}>
          Previous
        </Button>
        <span className="text-[0.8125rem] text-muted">
          {meta.page} / {meta.totalPages}
        </span>
        <Button size="sm" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/* ── feedback ────────────────────────────────────────────────────────────── */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <h3 className="font-display text-[0.9375rem] font-bold text-ink">{title}</h3>
      <p className="max-w-sm text-[0.8125rem] leading-relaxed text-muted">{body}</p>
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3.5">
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="h-3 animate-pulse rounded bg-line"
              style={{ width: c === 0 ? "38%" : `${12 + ((r + c) % 3) * 6}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "border-line bg-canvas text-ink-soft",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };
  const icons = {
    info: null,
    error: <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />,
    success: <Check className="mt-0.5 size-4 shrink-0" aria-hidden />,
    warning: <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />,
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[0.8125rem] leading-relaxed",
        tones[tone],
      )}
    >
      {icons[tone]}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── modal & confirmation ────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[0.9375rem] font-bold text-ink">{title}</h2>
            {description && <p className="mt-1 text-[0.8125rem] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** Destructive actions always pass through here — nothing deletes on one click. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="px-5 py-5">
        <div className="text-[0.875rem] leading-relaxed text-ink-soft">{body}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
