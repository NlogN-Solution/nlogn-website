import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { familyIcons } from "@/components/packages/icons";
import { packageFamilies } from "@/config/packages";

/** Landing-page shortlist. The full tier detail lives on /services. */
export function PackagesPreview() {
  const featured = packageFamilies.filter((f) =>
    ["digital-marketing", "seo", "websites", "software", "ai-automation", "ai-chatbots"].includes(
      f.slug,
    ),
  );

  return (
    <section id="packages" className="border-y border-line bg-surface py-16 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Packages"
          title={
            <>
              Systems you can buy, <span className="text-gradient-violet">not hours you rent</span>
            </>
          }
          lead="Every package is a system with an outcome attached. Take one, or combine them into a growth stack built around your business."
          action={
            <Button href="/services#packages" variant="secondary" arrow>
              Compare all packages
            </Button>
          }
        />

        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((family, i) => {
            const Icon = familyIcons[family.icon];
            return (
              <Reveal as="li" key={family.slug} delay={(i % 3) * 0.07}>
                <Link
                  href={`/services#${family.slug}`}
                  className="group flex h-full flex-col rounded-[24px] border border-line bg-canvas p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/25 hover:bg-surface hover:shadow-lift"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-violet-wash text-violet transition-colors duration-500 group-hover:bg-violet group-hover:text-white">
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>
                    <span className="label text-muted">{family.n}</span>
                  </div>

                  <p className="label mt-7 text-violet-deep">{family.system}</p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
                    {family.name}
                  </h3>
                  <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                    {family.intro}
                  </p>

                  <div className="mt-7 flex items-end justify-between border-t border-line-soft pt-5">
                    <span>
                      <span className="block text-xs text-muted">{family.model}</span>
                      <span className="font-display text-lg font-bold text-ink">
                        From {family.from}
                      </span>
                    </span>
                    <ArrowUpRight className="size-5 text-muted transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-col items-start gap-6 rounded-[24px] border border-violet/20 bg-violet-wash p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h3 className="font-display text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-extrabold tracking-tight text-ink">
                Not sure which one you need?
              </h3>
              <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
                Answer three questions and we will put a stack together around your goal —
                no package required.
              </p>
            </div>
            <Button href="/services#growth-stack" variant="violet" arrow className="shrink-0">
              Build my plan
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
