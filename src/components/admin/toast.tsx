"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toasts.
 *
 * Every async action in the dashboard reports through here — a save that
 * silently succeeds is as confusing as one that silently fails, so both end in
 * a toast.
 */

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; message: string };

const ToastContext = createContext<{
  toast: (message: string, tone?: Tone) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[0.8125rem] shadow-lift",
              item.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              item.tone === "error" && "border-red-200 bg-red-50 text-red-700",
              item.tone === "info" && "border-line bg-surface text-ink",
            )}
          >
            {item.tone === "success" && <Check className="mt-0.5 size-4 shrink-0" aria-hidden />}
            {item.tone === "error" && (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span className="min-w-0 flex-1">{item.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
              className="-mr-1 shrink-0 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}
