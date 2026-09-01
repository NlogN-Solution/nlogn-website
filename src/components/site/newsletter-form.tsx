"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("done");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 text-sm text-ink">
        <Check className="size-4 text-violet" aria-hidden />
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor={compact ? "nl-compact" : "nl-email"} className="sr-only">
        Email address
      </label>
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-5 transition-colors focus-within:border-violet/50">
        {/* size={1} drops the input's intrinsic ~20ch width. `flex-1` still
            fills the row, but the form no longer reports a 286px min-content
            that a grid track would honour on a phone. */}
        <input
          id={compact ? "nl-compact" : "nl-email"}
          type="email"
          required
          size={1}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-violet disabled:opacity-60"
          aria-label="Subscribe"
        >
          {state === "loading" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </form>
  );
}
