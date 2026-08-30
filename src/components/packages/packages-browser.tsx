"use client";

import { useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { familyIcons } from "@/components/packages/icons";
import { Button } from "@/components/ui/button";
import { packageFamilies } from "@/config/packages";
import { cn } from "@/lib/utils";

/**
 * Nine families × three tiers is a lot of information. It is shown one family
 * at a time, with each tier's full deliverable list behind a disclosure so the
 * comparison stays readable.
 */
export function PackagesBrowser() {
  const [active, setActive] = useState(packageFamilies[0].slug);
  const family = packageFamilies.find((f) => f.slug === active) ?? packageFamilies[0];
  const Icon = familyIcons[family.icon];

  return (
    <div id="packages" className="scroll-mt-28">
      {/* family selector */}
      <div className="-mx-5 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
        <div role="tablist" aria-label="Package families" className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {packageFamilies.map((f) => {
            const FIcon = familyIcons[f.icon];
            const on = f.slug === active;
            return (
              <button
                key={f.slug}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(f.slug)}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300",
                  on
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface text-ink-soft hover:border-ink/25 hover:text-ink",
                )}
              >
                <FIcon className="size-4 shrink-0" strokeWidth={1.9} aria-hidden />
                {f.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* family intro */}
      <div
        id={family.slug}
        className="mt-10 flex flex-col gap-6 scroll-mt-28 border-t border-line pt-10 md:flex-row md:items-start md:justify-between"
      >
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-violet-wash text-violet">
              <Icon className="size-5" strokeWidth={1.9} aria-hidden />
            </span>
            <span className="label text-muted">
              {family.n} · {family.pillar}
            </span>
          </div>
          <h3 className="mt-5 font-display text-[clamp(1.5rem,1.2rem+1.3vw,2.1rem)] font-extrabold tracking-tight text-ink">
            {family.system}
          </h3>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">{family.intro}</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-line bg-surface px-6 py-5">
          <p className="label text-muted">{family.model}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-ink">From {family.from}</p>
        </div>
      </div>

      {/* tiers */}
      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {family.tiers.map((tier) => (
          <li key={tier.name}>
            <article
              className={cn(
                "flex h-full flex-col rounded-[24px] border p-8",
                tier.badge
                  ? "border-violet/35 bg-surface shadow-[0_20px_50px_-30px_rgba(108,71,255,0.6)]"
                  : "border-line bg-surface",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-display text-xl font-bold tracking-tight text-ink">
                  {tier.name}
                </h4>
                {tier.badge && (
                  <span className="label flex shrink-0 items-center gap-1.5 rounded-full bg-violet px-3 py-1.5 text-white">
                    <Sparkles className="size-3" aria-hidden />
                    {tier.badge}
                  </span>
                )}
              </div>

              <p className="mt-3 font-display text-[0.95rem] font-medium text-violet-deep">
                {tier.tagline}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{tier.summary}</p>

              <p className="mt-6 font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.04em] text-ink">
                {tier.from}
              </p>
              <p className="mt-2 text-xs text-muted">Best for: {tier.bestFor}</p>

              <ul className="mt-6 space-y-3 border-t border-line-soft pt-6">
                {tier.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-[0.9375rem] text-ink-soft">
                    <Check className="mt-1 size-4 shrink-0 text-violet" strokeWidth={2.5} aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>

              <details className="group mt-6 border-t border-line-soft pt-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  Everything included
                  <ChevronDown
                    className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="mt-5 space-y-5">
                  {tier.groups.map((group) => (
                    <div key={group.title}>
                      <p className="label text-muted">{group.title}</p>
                      <ul className="mt-2.5 space-y-1.5">
                        {group.items.map((item) => (
                          <li key={item} className="text-[0.875rem] leading-relaxed text-muted">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>

              <div className="mt-7 pt-1">
                <Button
                  href={`/contact?package=${encodeURIComponent(`${family.name} — ${tier.name}`)}`}
                  variant={tier.badge ? "violet" : "secondary"}
                  className="w-full"
                  arrow
                >
                  Get a proposal
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-muted">
        Every figure above is a starting point. Final pricing comes out of a scoping call once
        we understand the complexity — and it is fixed before anything begins.
      </p>
    </div>
  );
}
