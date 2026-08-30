import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { siteConfig } from "@/config/site";

const promises = [
  "A written diagnosis before any proposal",
  "Fixed scope, fixed price, no change-order games",
  "You own the code, accounts and design files",
];

export function CtaBand({
  title = "Let's find your next 240%.",
  lead = "Tell us the number you need to move. We will come back within one working day with an honest read on whether we can move it — and what it would take.",
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section className="container-x pb-4 pt-16 md:pt-28">
      <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-16 md:px-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_80%_at_20%_0%,rgba(108,71,255,0.45)_0%,transparent_55%)]" />
        <GrowthCurve
          width={1200}
          height={400}
          animate={false}
          strokeWidth={1.5}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full opacity-25"
          id="cta-curve"
        />

        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <div>
            <h2 className="max-w-xl text-[clamp(2.1rem,1.3rem+3vw,3.6rem)] font-extrabold leading-[1.04] text-white">
              {title}
            </h2>
            <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-white/65">{lead}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href="/contact" variant="violet" size="lg" arrow>
                Start a project
              </Button>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-[0.9375rem] font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                or email {siteConfig.email}
              </a>
            </div>
          </div>

          <ul className="space-y-4">
            {promises.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[0.9375rem] text-white/75">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-violet/25 text-violet-soft">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
