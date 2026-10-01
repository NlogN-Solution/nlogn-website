import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaBand } from "@/components/site/cta-band";
import { Faq } from "@/components/landing/sections/faq";
import { Process } from "@/components/landing/sections/process";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { faqs, processSteps } from "@/config/site";
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

const needs = [
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
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Our process"
        title={
          <>
            Eight weeks, six steps, <em>nothing hidden.</em>
          </>
        }
        lead="You see a staging URL in week one and a live changelog throughout. Here is exactly what happens, when, and what we need from you at each point."
        crumbs={crumbs}
      />

      <Process eyebrow="01 / How it comes together" />

      <section className="page-section is-grey">
        <div className="wrap">
          <SectionHeading
            eyebrow="02 / Week by week"
            aside="Six steps"
            title={
              <>
                What happens,
                <br />
                and <em>what you receive.</em>
              </>
            }
            lead="Every step ends with something you can hold — a document, a design file, a working build — signed off before the next one starts."
          />
          <div className="steps steps-detail">
            {processSteps.map((step) => (
              <article key={step.n} id={step.title.toLowerCase()}>
                <span>{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <small>{step.duration}</small>
                </div>
                <p>{step.body}</p>
                <ul className="ticks">
                  {step.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="03 / What we need from you"
            title={
              <>
                Three things that decide
                <br />
                whether we <em>ship on time.</em>
              </>
            }
            lead="Projects rarely slip because of engineering. They slip because of these."
          />
          <ul className="panels" style={{ "--cols": 3 } as React.CSSProperties}>
            {needs.map((item, i) => (
              <li key={item.title} className="panel reveal">
                <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faq
        eyebrow="04 / Questions"
        title={
          <>
            Answered before
            <br />
            you have to ask.
          </>
        }
        items={faqs}
      />
      <CtaBand
        title={
          <>
            Week one starts <em>whenever you do.</em>
          </>
        }
      />

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
