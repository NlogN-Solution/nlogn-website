import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HeroPlot } from "@/components/home/hero-plot";
import { StatsBand } from "@/components/home/stats";

/** Entrances run in CSS so the headline never waits on JavaScript. */
const step = (i: number) => ({ "--d": `${i * 0.09}s` }) as React.CSSProperties;

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* ── atmosphere: a lavender canvas with two soft blooms ──────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(168deg,#f6f3fb_0%,#f3effa_46%,#f5f2fa_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(38%_44%_at_86%_16%,rgba(167,139,250,0.20),transparent_70%),radial-gradient(30%_36%_at_4%_2%,rgba(255,255,255,0.9),transparent_68%)]"
      />

      <div className="container-x relative pt-28 md:pt-30 lg:pt-32">
        <div className="grid items-end gap-y-14 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] lg:gap-x-12">
          {/* ── copy ─────────────────────────────────────────────────── */}
          <div className="relative z-10 lg:pb-6">
            <span
              className="anim-in inline-flex items-center gap-3 rounded-full border border-line bg-surface/70 px-4 py-2.5 backdrop-blur"
              style={step(0)}
            >
              <span className="size-2 rounded-full bg-violet" />
              <span className="text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink-soft">
                Digital growth partner
              </span>
            </span>

            <h1 className="mt-9 text-[clamp(2.6rem,1.05rem+3.5vw,4.15rem)] font-semibold leading-[1.07] tracking-[-0.04em] text-ink">
              <span className="anim-in block" style={step(1)}>
                Digital systems
              </span>
              <span className="anim-in block" style={step(2)}>
                built for <span className="text-gradient-hero">real growth.</span>
              </span>
            </h1>

            <p
              className="anim-in mt-8 max-w-[33rem] text-[1.0625rem] leading-[1.75] text-ink-soft md:text-[1.125rem]"
              style={step(3)}
            >
              We combine digital marketing, software and AI automation to help ambitious
              businesses grow, operate smarter and move faster.
            </p>

            <div className="anim-in mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={step(4)}>
              <Link
                href="/contact"
                className="group inline-flex h-[3.6rem] items-center gap-3.5 rounded-[0.95rem] bg-ink pl-7 pr-2 text-[1.0625rem] font-medium text-white shadow-[0_14px_36px_-14px_rgba(11,11,15,0.5)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-14px_rgba(11,11,15,0.55)]"
              >
                Start a project
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full bg-violet text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45"
                >
                  <ArrowUpRight className="size-[1.05rem]" strokeWidth={2.2} />
                </span>
              </Link>

              <Link
                href="/works"
                className="group inline-flex items-center gap-2.5 text-[1.0625rem] font-medium text-ink transition-colors hover:text-violet-deep"
              >
                View our work
                <ArrowUpRight
                  className="size-[1.05rem] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>

          {/* ── the curve the company is named after ─────────────────── */}
          <HeroPlot className="anim-in lg:-mr-[4vw] xl:-mr-[5vw]" />
        </div>

        <div className="anim-in mt-16 md:mt-20" style={step(5)}>
          <StatsBand />
        </div>
      </div>
    </section>
  );
}
