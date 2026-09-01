import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaBand } from "@/components/site/cta-band";
import { FaqSection } from "@/components/home/faq-section";
import { nlognPath, nlognPoint } from "@/components/ui/growth-curve";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { processSteps } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Our process — from audit to compounding growth in eight weeks",
  description:
    "Six steps: discover, strategy, design, build, launch, grow. What happens each week, what you receive, and what we need from you. No black boxes.",
  path: "/process",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Process", path: "/process" },
];

const W = 1200;
const H = 240;

export default function ProcessPage() {
  const path = nlognPath(W, H, 64, 8);
  const markers = processSteps.map((_, i) => nlognPoint(W, H, (i + 0.5) / processSteps.length, 8));

  return (
    <>
      <PageHero
        eyebrow="Our process"
        title={
          <>
            Eight weeks, six steps, <span className="text-gradient-violet">nothing hidden</span>
          </>
        }
        lead="You see a staging URL in week one and a live changelog throughout. Here is exactly what happens, when, and what we need from you at each point."
        crumbs={crumbs}
      />

      <section className="container-x py-16 md:py-24">
        <div className="relative hidden lg:block">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full" fill="none" aria-hidden>
            <defs>
              <linearGradient id="process-page-stroke" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#e5e5ea" />
                <stop offset="45%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4526c9" />
              </linearGradient>
            </defs>
            <path d={path} stroke="url(#process-page-stroke)" strokeWidth="2.5" strokeLinecap="round" />
            {markers.map((m, i) => (
              <g key={i}>
                <line x1={m.x} y1={m.y} x2={m.x} y2={H} stroke="#0b0b0f" strokeOpacity="0.08" strokeDasharray="3 5" />
                <circle cx={m.x} cy={m.y} r="10" fill="#fff" />
                <circle cx={m.x} cy={m.y} r="5.5" fill={i < 3 ? "#a78bfa" : "#6c47ff"} />
                <text
                  x={m.x}
                  y={m.y - 20}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="12"
                  fill="#74747f"
                  letterSpacing="1.6"
                >
                  {processSteps[i].n}
                </text>
              </g>
            ))}
          </svg>
          <p className="label absolute -left-1 bottom-1 text-muted">effort n →</p>
          <p className="label absolute -top-2 right-0 text-muted">↑ output</p>
        </div>

        <ol className="mt-8 space-y-5">
          {processSteps.map((step, i) => (
            <Reveal as="li" key={step.n} delay={(i % 3) * 0.06}>
              <div className="grid gap-8 rounded-[26px] border border-line bg-surface p-8 md:grid-cols-[0.9fr_1.4fr_1fr] md:p-10">
                <div>
                  <p className="label text-violet">{step.n}</p>
                  <h2 className="mt-4 font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-extrabold tracking-tight text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{step.duration}</p>
                </div>
                <p className="text-[1.0625rem] leading-relaxed text-ink-soft">{step.body}</p>
                <div className="rounded-[20px] bg-canvas p-7">
                  <p className="label text-muted">You receive</p>
                  <ul className="mt-4 space-y-3">
                    {step.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-3 text-sm text-ink-soft">
                        <Check className="mt-0.5 size-4 shrink-0 text-violet" strokeWidth={2.5} aria-hidden />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-surface py-16 md:py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow="What we need from you"
            title="Three things that decide whether we ship on time"
            lead="Projects rarely slip because of engineering. They slip because of these."
          />
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "One decision-maker",
                body: "Someone who can approve a wireframe without convening a committee. Reviews by committee add two weeks, every time.",
              },
              {
                title: "Content, early",
                body: "Copy, photography and product data in week two rather than week six. Projects with content ready ship two weeks faster on average.",
              },
              {
                title: "Access, on day one",
                body: "Analytics, Search Console, DNS and hosting. We cannot baseline what we cannot see, and the audit is what everything else is built on.",
              },
            ].map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 0.07}>
                <div className="h-full rounded-[24px] border border-line bg-canvas p-8">
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection />
      <CtaBand title="Week one starts whenever you do." />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "HowTo",
            name: "How nlogn runs a digital growth engagement",
            description:
              "The six-step process nlogn uses to take a project from initial audit to compounding growth.",
            totalTime: "P8W",
            step: processSteps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.body,
              url: absoluteUrl(`/process#${s.title.toLowerCase()}`),
            })),
          },
        ]}
        id="process-schema"
      />
    </>
  );
}
