"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { capabilities } from "@/config/capabilities";
import { cn } from "@/lib/utils";

const budgets = ["Under $2k", "$2k – 5k", "$8k – $20k", "$30k+", "Not sure yet"];

const field =
  "w-full rounded-2xl border border-line bg-canvas px-5 py-3.5 text-[0.9375rem] text-ink shadow-inset outline-none transition-colors placeholder:text-muted focus:border-violet/60";

export function ContactForm() {
  const params = useSearchParams();
  // Carried over from a package card or the growth-stack builder.
  const prefill = params.get("plan") ?? "";
  const pkg = params.get("package") ?? "";

  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState(budgets[1]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          budget,
          // Carried from a package card or the growth-stack builder so the
          // enquiry arrives knowing what the visitor was looking at.
          packageName: pkg || undefined,
          planSummary: prefill || undefined,
          source: pkg ? "PACKAGE_ENQUIRY" : prefill ? "GROWTH_STACK" : "CONTACT_FORM",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "We could not send that. Try again?");
      setState("done");
      setMessage(data.message ?? "Message received.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-[26px] border border-line bg-surface p-10 text-center shadow-soft">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-violet-wash text-violet">
          <Check className="size-6" strokeWidth={2.5} aria-hidden />
        </span>
        <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink">
          Message received
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
          {message} We reply to every enquiry within one working day — usually with a
          question or two before we send anything that looks like a proposal.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[26px] border border-line bg-surface p-8 shadow-soft md:p-10">
      {(pkg || prefill) && (
        <p className="mb-7 rounded-2xl border border-violet/20 bg-violet-wash px-5 py-4 text-[0.9375rem] text-ink-soft">
          {pkg ? (
            <>
              Enquiring about <strong className="font-semibold text-ink">{pkg}</strong>.
            </>
          ) : (
            <>We&apos;ve carried your growth stack across — edit it below if anything changed.</>
          )}
        </p>
      )}

      {/* Honeypot: hidden from people, irresistible to bots */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Leave this empty</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label mb-2.5 block text-ink">
            Your name *
          </label>
          <input id="name" name="name" required autoComplete="name" className={field} placeholder="Anjana Shrestha" />
        </div>
        <div>
          <label htmlFor="email" className="label mb-2.5 block text-ink">
            Work email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="company" className="label mb-2.5 block text-ink">
            Company
          </label>
          <input id="company" name="company" autoComplete="organization" className={field} placeholder="Acme Ltd" />
        </div>
        <div>
          <label htmlFor="service" className="label mb-2.5 block text-ink">
            What do you need?
          </label>
          <select
            id="service"
            name="service"
            className={cn(field, "appearance-none")}
            defaultValue={capabilities.find((c) => pkg.startsWith(c.label))?.label ?? ""}
          >
            <option value="">Not sure — help me choose</option>
            {capabilities.map((capability) => (
              <option key={capability.id} value={capability.label}>
                {capability.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-7">
        <legend className="label mb-3 text-ink">Budget range</legend>
        <div className="flex flex-wrap gap-2">
          {budgets.map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => setBudget(b)}
              aria-pressed={budget === b}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                budget === b
                  ? "border-violet bg-violet text-white"
                  : "border-line text-ink-soft hover:border-ink/25",
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7">
        <label htmlFor="message" className="label mb-2.5 block text-ink">
          What are you trying to move? *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={cn(field, "resize-y")}
          defaultValue={
            pkg ? `I'd like a proposal for ${pkg}.\n\n` : prefill ? `${prefill}\n\n` : ""
          }
          placeholder="We get 4,000 visits a month and about 12 enquiries. We would like that to be 40 without spending more on ads."
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={state === "loading"}
          className="group inline-flex h-[3.4rem] items-center gap-2.5 rounded-full bg-ink px-8 font-medium text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a1a22] hover:shadow-lift disabled:opacity-60"
        >
          {state === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending
            </>
          ) : (
            <>
              Send message
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
        <p className="text-sm text-muted">Replies within one working day.</p>
      </div>

      {state === "error" && (
        <p role="alert" className="mt-5 text-sm text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}
