"use client";

import { useState } from "react";
import { ArrowRight, Check, Code2, Download, ExternalLink, Loader2, Mail, ShieldCheck } from "lucide-react";
import type { ResourceDestination } from "@/config/resources";

/**
 * The email gate: one field, and everything else subordinate to it.
 *
 * Most of this traffic arrives inside Instagram's or Facebook's in-app browser
 * — a cramped viewport where password managers do not fire and autofill is
 * unreliable — so every decision here is about removing keystrokes. One
 * required input, `type="email"` to summon the right keyboard, `autoComplete`
 * so the browser can still help, and the name left optional because it is worth
 * having only when giving it is free.
 *
 * On success the repository link unlocks in place and the same link is emailed.
 * The in-page unlock is what they came for; the email is what they still have
 * tomorrow on a different device.
 */
export function ResourceGate({
  slug,
  buttonLabel,
  destination,
}: {
  slug: string;
  buttonLabel: string;
  /**
   * Where the grant leads, decided by `resourceDestination` on the server so the
   * button in front of the form and the redirect behind it cannot disagree.
   *
   * A repository or an external URL opens in its own tab, and the unlocked panel
   * is worth keeping on screen behind it: it holds the only copy of the link the
   * visitor has until the email lands. A streamed file must *not* open a new
   * tab, or they are left staring at a blank one.
   */
  destination: ResourceDestination | null;
}) {
  const opensNewTab = destination === "repo" || destination === "external";
  const Icon = destination === "repo" ? Code2 : destination === "external" ? ExternalLink : Download;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [unlocked, setUnlocked] = useState<{ url: string; emailed: string } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");

    try {
      const res = await fetch("/api/resources/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, name, marketingConsent: consent }),
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload?.error?.message ?? "We could not unlock that just now.");
      }

      setUnlocked({ url: payload.data.downloadUrl, emailed: payload.data.emailed });
      setState("done");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not unlock that just now.");
    }
  }

  if (state === "done" && unlocked) {
    return (
      <div className="rounded-[22px] border border-violet/30 bg-violet-wash p-7 md:p-8">
        <p className="flex items-center gap-2 font-display text-lg font-bold tracking-[-0.02em] text-ink">
          <Check className="size-5 text-violet" aria-hidden />
          It&rsquo;s yours
        </p>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
          The link is on its way to{" "}
          <strong className="font-medium text-ink">{unlocked.emailed}</strong> as well, so you have
          it on your laptop later. Clone it, fork it, ship it.
        </p>
        <a
          href={unlocked.url}
          {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Icon className="size-4" aria-hidden />
          {buttonLabel}
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[22px] border border-line bg-surface p-7 md:p-8"
    >
      <p className="flex items-center gap-2 font-display text-lg font-bold tracking-[-0.02em] text-ink">
        <Mail className="size-5 text-violet" aria-hidden />
        Where should the link go?
      </p>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
        One field. The repository opens straight away and the link is emailed to you as well.
      </p>

      <div className="mt-6 space-y-3">
        <div>
          <label htmlFor="gate-email" className="sr-only">
            Email address
          </label>
          <input
            id="gate-email"
            type="email"
            required
            size={1}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full min-w-0 rounded-xl border border-line bg-canvas px-4 py-3.5 text-[1rem] text-ink outline-none transition-colors placeholder:text-muted focus:border-violet/50"
          />
        </div>

        <div>
          <label htmlFor="gate-name" className="sr-only">
            First name (optional)
          </label>
          <input
            id="gate-name"
            type="text"
            size={1}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="First name (optional)"
            autoComplete="given-name"
            className="w-full min-w-0 rounded-xl border border-line bg-canvas px-4 py-3.5 text-[1rem] text-ink outline-none transition-colors placeholder:text-muted focus:border-violet/50"
          />
        </div>
      </div>

      {/*
        Unticked, and separate from the download. Sending the file is fulfilling
        a request; mailing them afterwards is a different permission, and one
        pre-ticked box cannot honestly carry both.
      */}
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[0.875rem] leading-relaxed text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-line accent-violet"
        />
        Send me the occasional build note too. No more than monthly, unsubscribe any time.
      </label>

      {state === "error" && (
        <p role="alert" className="mt-4 text-[0.875rem] text-red-600">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
      >
        {state === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Unlocking…
          </>
        ) : (
          <>
            {buttonLabel}
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </button>

      <p className="mt-4 flex items-start gap-2 text-[0.8125rem] leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
        Your address is used to send you this link and nothing else unless you tick the box.
      </p>
    </form>
  );
}
