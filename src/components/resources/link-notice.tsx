"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

/**
 * What a dead download link says when it lands here.
 *
 * A client component reading the query rather than the page reading
 * `searchParams`, so the library itself stays prerendered — one visitor
 * arriving on an expired link must not cost everyone else a dynamic render.
 */

const MESSAGES: Record<string, string> = {
  expired: "That download link has expired. Unlock the resource again below and we'll send a fresh one — it takes a second.",
  "used-up": "That link had been used its maximum number of times. Unlock the resource again below for a new one.",
  unknown: "We did not recognise that download link. It may have been copied incompletely — unlock the resource again below.",
  withdrawn: "That resource is no longer published. Everything still available is on the shelf below.",
};

export function LinkNotice() {
  const params = useSearchParams();
  const message = MESSAGES[params.get("link") ?? ""];
  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-10 flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-[0.9375rem] leading-relaxed text-amber-900"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}
