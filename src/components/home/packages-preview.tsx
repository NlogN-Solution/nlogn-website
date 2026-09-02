import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { familyIcons } from "@/components/packages/icons";
import { packageFamilies, type PackageFamily } from "@/config/packages";

/**
 * The services deck — a plain responsive grid.
 *
 * Every featured family is one card, all visible at once, scrolled with the
 * page. No pinning, no scroll-scrubbed transforms: the section reads in a
 * glance and behaves the way a list of links should.
 */

const FEATURED = [
  "digital-marketing",
  "seo",
  "websites",
  "software",
  "ai-automation",
  "ai-chatbots",
];

/**
 * The supplied artwork is stock illustration in six unrelated styles, so it is
 * desaturated and multiplied into the lavender panel rather than dropped in at
 * full colour. It returns to colour on hover.
 */
const ART: Record<string, string> = {
  "digital-marketing": "/services/digital-marketing.webp",
  seo: "/services/seo.webp",
  websites: "/services/web-development.webp",
  software: "/services/it-solutions.webp",
  "ai-automation": "/services/ai-automation.webp",
  "ai-chatbots": "/services/ai-chatbots-agents.webp",
};

/* ── the card ───────────────────────────────────────────────────────────── */

function Card({ family }: { family: PackageFamily }) {
  const Icon = familyIcons[family.icon];
  const art = ART[family.slug];

  return (
    <Link
      href={`/services#${family.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift"
    >
      <div className="relative h-36 shrink-0 overflow-hidden border-b border-line-soft bg-[linear-gradient(160deg,#f6f2ff,#ece5fb)] sm:h-44">
        {art && (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24rem"
            className="object-contain p-5 grayscale-[0.45] transition-[filter,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        )}
        <span className="label absolute right-6 top-5 text-muted">{family.n}</span>
      </div>

      <div className="relative flex flex-1 flex-col p-7 sm:p-8">
        <span className="absolute -top-7 left-7 grid size-14 place-items-center rounded-2xl border border-line bg-surface text-violet shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:bg-violet group-hover:text-white sm:left-8">
          <Icon className="size-6" strokeWidth={1.85} />
        </span>

        <p className="label mt-7 text-violet-deep">{family.system}</p>
        <h3 className="mt-2.5 font-display text-[1.55rem] font-bold leading-tight tracking-[-0.03em] text-ink">
          {family.name}
        </h3>
        <p className="mt-3.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{family.intro}</p>

        <div className="mt-6 flex items-end justify-between border-t border-line-soft pt-5">
          <span>
            <span className="block text-xs text-muted">{family.model}</span>
            <span className="font-display text-lg font-bold text-ink">From {family.from}</span>
          </span>
          <ArrowUpRight className="size-5 text-muted transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-violet" />
        </div>
      </div>
    </Link>
  );
}

/* ── the section ────────────────────────────────────────────────────────── */

export function PackagesPreview() {
  const families = packageFamilies.filter((f) => FEATURED.includes(f.slug));

  return (
    <section id="services-offered" className="border-y border-line bg-surface py-16 md:py-24">
      <div className="container-x">
        <SectionHeading
          eyebrow="Services we offer"
          title={
            <>
              Systems you can buy,{" "}
              <span className="text-gradient-violet">not hours you rent</span>
            </>
          }
          lead="Every service is a system with an outcome attached. Take one, or combine them into a growth stack built around your business."
          action={
            <Button href="/services#packages" variant="secondary" arrow>
              Compare all services
            </Button>
          }
        />

        <ul className="mt-16 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((family, i) => (
            <Reveal as="li" key={family.slug} delay={(i % 3) * 0.08} className="h-full">
              <Card family={family} />
            </Reveal>
          ))}
        </ul>

        <div className="mt-16 flex flex-col items-start gap-6 rounded-[24px] border border-violet/20 bg-violet-wash p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h3 className="font-display text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-extrabold tracking-tight text-ink">
              Not sure which one you need?
            </h3>
            <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
              Answer three questions and we will put a stack together around your goal — without
              picking a service first.
            </p>
          </div>
          <Button href="/services#growth-stack" variant="violet" arrow className="shrink-0">
            Build my plan
          </Button>
        </div>
      </div>
    </section>
  );
}
