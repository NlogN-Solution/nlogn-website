"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { stackBuilder } from "@/config/packages";
import { cn } from "@/lib/utils";

type Step = { key: "needs" | "goals" | "existing"; n: string; question: string; options: readonly string[] };

const steps: Step[] = [
  { key: "needs", n: "01", question: "What do you need?", options: stackBuilder.needs },
  { key: "goals", n: "02", question: "What is your goal?", options: stackBuilder.goals },
  { key: "existing", n: "03", question: "What do you already have?", options: stackBuilder.existing },
];

/**
 * Three questions instead of a pricing table. The selection is carried into
 * the contact form as a prefilled brief rather than posted anywhere.
 */
export function GrowthStack() {
  const [picked, setPicked] = useState<Record<Step["key"], string[]>>({
    needs: [],
    goals: [],
    existing: [],
  });

  const toggle = (key: Step["key"], value: string) =>
    setPicked((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  const total = picked.needs.length + picked.goals.length + picked.existing.length;
  const brief = [
    picked.needs.length ? `Need: ${picked.needs.join(", ")}` : "",
    picked.goals.length ? `Goal: ${picked.goals.join(", ")}` : "",
    picked.existing.length ? `Already have: ${picked.existing.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div id="growth-stack" className="scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        <div className="space-y-10">
          {steps.map((step) => (
            <fieldset key={step.key}>
              <legend className="flex items-baseline gap-3">
                <span className="label text-violet">{step.n}</span>
                <span className="font-display text-lg font-bold tracking-tight text-ink">
                  {step.question}
                </span>
              </legend>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {step.options.map((option) => {
                  const on = picked[step.key].includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(step.key, option)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all duration-300",
                        on
                          ? "border-violet bg-violet text-white"
                          : "border-line bg-surface text-ink-soft hover:border-ink/25 hover:text-ink",
                      )}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[26px] bg-ink p-8 md:p-10">
            <p className="label text-violet-soft">Your growth stack</p>

            {total === 0 ? (
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/55">
                Pick what applies. We will read it as a brief and come back with the system we
                would actually build — including the parts you do not need yet.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {steps.map((step) =>
                  picked[step.key].length ? (
                    <li key={step.key}>
                      <p className="label text-white/40">{step.question}</p>
                      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-white">
                        {picked[step.key].join(" · ")}
                      </p>
                    </li>
                  ) : null,
                )}
              </ul>
            )}

            <Link
              href={`/contact${brief ? `?plan=${encodeURIComponent(brief)}` : ""}`}
              className={cn(
                "group mt-8 inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-full font-medium transition-all duration-300",
                total === 0
                  ? "bg-white/10 text-white/60 hover:bg-white/15"
                  : "bg-[linear-gradient(96deg,#8b5cf6_0%,#6c47ff_55%,#7c3aed_100%)] text-white hover:-translate-y-0.5",
              )}
            >
              Build my plan
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>

            <p className="mt-4 text-center text-xs text-white/35">
              No obligation. We reply within one working day.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
