import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { method, siteConfig, stats, team, values } from "@/config/site";
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
            Four specialists. One team. <em>Built for digital.</em>
          </>
        }
        lead={`nlogn is a four-person digital team based in Nepal, helping businesses build, improve, and grow through technology — from websites and custom software to business systems, AI, automation and search.

No account managers. No unnecessary handoffs. The people who understand your business are the same people who design, build, and deliver the solution.`}
        crumbs={crumbs}
      />

      <section className="page-section">
        <div className="wrap">
          <div className="split">
            <div className="sticky">
              <p className="eyebrow">01 / The name</p>
              <h2>
                Why we are
                <br />
                called <em>nlogn.</em>
              </h2>
            </div>
            <div className="copy reveal">
              <p>
                O(n log n) is the cost of an efficient sort. Double the input and the work grows —
                but nowhere near twice as fast. It is the shape of every growth curve worth
                building: effort compounds into output rather than being consumed by it.
              </p>
              <p>
                Most agency work is O(n²). Every new page needs a new template, every feature
                starts from scratch, every hire slows the team down. We build systems instead:
                design systems, content models, component libraries and measurement that make the
                tenth page cheaper than the first.
              </p>
              <p>
                That is also why we say no more often than most studios. If a request will not
                compound — a one-off microsite, a rebrand with no distribution plan, a feature with
                no one waiting to use it — we will tell you, and usually suggest the cheaper thing
                that works.
              </p>
            </div>
          </div>
          <dl className="stat-row reveal" style={{ marginTop: 90 }}>
            {stats.slice(0, 4).map((s) => (
              <div key={s.label}>
                <dd>{s.value}</dd>
                <dt>{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="page-section is-grey">
        <div className="wrap">
          <div className="split">
            <div className="sticky">
              <p className="eyebrow">02 / The method</p>
              <h2>
                Three people.
                <br />
                One method.
                <br />
                <em>Built for growth.</em>
              </h2>
              <p className="lede" style={{ marginTop: 28 }}>
                Strategy first, then the build, then the growth work that compounds — with
                automation taking the repetitive parts off your team.
              </p>
            </div>
            <div className="steps">
              {method.map((step) => (
                <article key={step.n}>
                  <span>{step.n}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="03 / The team"
            aside="No layers in between."
            title={
              <>
                Everyone here
                <br />
                <em>does the work.</em>
              </>
            }
            lead="No layer between you and the person writing the code, the copy or the design."
          />
          <ul className="team">
            {team.map((member) => (
              <li key={member.name} className="reveal">
                <figure>
                  <div className="team-photo">
                    <Image
                      src={member.photo}
                      alt={`${member.name}, ${member.role} at nlogn`}
                      fill
                      quality={95}
                      sizes="(max-width: 700px) 110vw, (max-width: 1000px) 60vw, 40vw"
                      style={{ objectPosition: member.focus }}
                    />
                  </div>
                  <figcaption>
                    <h3>{member.name}</h3>
                    <span>{member.role}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-section is-ruled">
        <div className="wrap">
          <SectionHeading
            eyebrow="04 / What we hold to"
            title={
              <>
                Four rules
                <br />
                we <em>do not break.</em>
              </>
            }
          />
          <ul className="panels">
            {values.map((v, i) => (
              <li key={v.title} className="panel reveal">
                <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials eyebrow="05 / In their words" />
      <CtaBand
        title={
          <>
            Come work <em>with us.</em>
          </>
        }
      />

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
