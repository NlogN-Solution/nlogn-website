import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { nlognPath, nlognPoint } from "@/components/ui/growth-curve";
import { processSteps } from "@/config/site";

const W = 1200;
const H = 200;

export function ProcessSection() {
  const path = nlognPath(W, H, 64, 8);
  const markers = processSteps.map((_, i) => nlognPoint(W, H, (i + 0.5) / processSteps.length, 8));

  return (
    <section className="border-y border-line bg-surface py-16 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="How we work"
          title={
            <>
              A six-step run from audit to <span className="text-gradient-violet">compounding</span>
            </>
          }
          lead="Plotted, fittingly, on an n·log n curve. The early weeks cost the most effort and return the least — which is exactly why most agencies skip them."
          action={
            <Button href="/process" variant="secondary" arrow>
              The full process
            </Button>
          }
        />

        {/* Curve rail — the markers sit on the actual function, one per column */}
        <div className="relative mt-16 hidden lg:block">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" fill="none" aria-hidden>
            <defs>
              <linearGradient id="process-stroke" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#e5e5ea" />
                <stop offset="45%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4526c9" />
              </linearGradient>
            </defs>
            <path d={path} stroke="url(#process-stroke)" strokeWidth="2.5" strokeLinecap="round" />
            {markers.map((m, i) => (
              <g key={i}>
                <line
                  x1={m.x}
                  y1={m.y}
                  x2={m.x}
                  y2={H}
                  stroke="#0b0b0f"
                  strokeOpacity="0.08"
                  strokeDasharray="3 5"
                />
                <circle cx={m.x} cy={m.y} r="9" fill="#fff" />
                <circle cx={m.x} cy={m.y} r="5" fill={i < 3 ? "#a78bfa" : "#6c47ff"} />
              </g>
            ))}
          </svg>
          <p className="label absolute -left-1 bottom-0 text-muted">effort n →</p>
        </div>

        <ol className="mt-6 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-6 lg:gap-x-5">
          {processSteps.map((step, i) => (
            <Reveal as="li" key={step.n} delay={(i % 3) * 0.07} className="lg:border-t lg:border-line lg:pt-6">
              <div className="flex items-baseline gap-3">
                <span className="label text-violet">{step.n}</span>
                <span className="label text-muted">{step.duration}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
