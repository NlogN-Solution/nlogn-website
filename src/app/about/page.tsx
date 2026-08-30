import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Method } from "@/components/about/method";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBand } from "@/components/site/cta-band";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { siteConfig, stats, team, values } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "About nlogn — the studio behind the growth",
  description:
    "Founded in 2019 in Lalitpur, Nepal. A four-person studio building websites, software and search programmes for businesses in Nepal, Australia, the UK and the Gulf.",
  path: "/about",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            A small studio that ships like a <span className="text-gradient-violet">much larger one</span>
          </>
        }
        lead="nlogn is four specialists in Lalitpur, Nepal, working with businesses that need a website, a platform or a search programme to actually earn its keep. No account managers, no handoffs — the people who scope your project are the people who build it."
        crumbs={crumbs}
      />

      <section className="container-x py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <Reveal>
            <h2 className="font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.25rem)] font-extrabold tracking-tight text-ink">
              Why we are called nlogn
            </h2>
            <div className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-ink-soft">
              <p>
                O(n log n) is the cost of an efficient sort. Double the input and the work
                grows — but nowhere near twice as fast. It is the shape of every
                growth curve worth building: effort compounds into output rather than
                being consumed by it.
              </p>
              <p>
                Most agency work is O(n²). Every new page needs a new template, every
                campaign starts from scratch, every hire slows the team down. We build
                systems instead: design systems, content models, component libraries and
                measurement that make the tenth page cheaper than the first.
              </p>
              <p>
                That is also why we say no more often than most studios. If a request
                will not compound — a one-off microsite, a rebrand with no distribution
                plan, a campaign with no landing page behind it — we will tell you, and
                usually suggest the cheaper thing that works.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[26px] border border-line bg-surface p-8">
              <GrowthCurve
                width={420}
                height={200}
                strokeWidth={2.5}
                fill
                id="about-curve"
                className="h-40 w-full"
              />
              <p className="label mt-6 text-muted">n · log n</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                Plotted from the function, not drawn by hand. The same curve appears on
                every chart on this site — it is the only growth shape we are willing to
                promise.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6">
                {stats.slice(0, 4).map((s) => (
                  <div key={s.label}>
                    <dd className="font-display text-2xl font-extrabold text-ink">{s.value}</dd>
                    <dt className="mt-1 text-sm text-muted">{s.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 md:py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow="The method"
            title="Four people. One method. Built for growth."
            lead="Strategy first, then the build, then the growth work that compounds — with automation taking the repetitive parts off your team."
          />
          <Method />
        </div>
      </section>

      <section className="container-x py-16 md:py-24">
        <SectionHeading
          eyebrow="The team"
          title="Everyone here does the work"
          lead="Four people. No layer between you and the person writing the code, the copy or the campaign."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <Reveal as="li" key={member.name} delay={i * 0.07}>
              <div className="h-full rounded-[24px] border border-line bg-surface p-8">
                <span className="grid size-14 place-items-center rounded-2xl bg-ink font-display text-sm font-bold text-white">
                  {member.initials}
                </span>
                <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-ink">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-violet-deep">{member.role}</p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{member.bio}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="container-x pb-8">
        <SectionHeading eyebrow="What we hold to" title="Four rules we do not break" />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2">
          {values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 0.07}>
              <div className="h-full rounded-[24px] border border-line bg-surface p-8">
                <h3 className="font-display text-lg font-bold tracking-tight text-ink">{v.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <Testimonials />
      <CtaBand title="Come work with the four of us." />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "AboutPage",
            url: absoluteUrl("/about"),
            name: "About nlogn",
            isPartOf: { "@id": absoluteUrl("/#website") },
            mainEntity: {
              "@id": absoluteUrl("/#organization"),
              employee: team.map((m) => ({
                "@type": "Person",
                name: m.name,
                jobTitle: m.role,
                worksFor: { "@id": absoluteUrl("/#organization") },
              })),
              foundingLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: siteConfig.address.city,
                  addressCountry: siteConfig.address.country,
                },
              },
            },
          },
        ]}
        id="about-schema"
      />
    </>
  );
}
