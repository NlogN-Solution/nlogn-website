import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { GrowthCurve } from "@/components/ui/growth-curve";

type Crumb = { name: string; path: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 text-line" aria-hidden />}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-ink-soft">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-ink">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line pb-16 pt-32 md:pb-24 md:pt-44">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_80%_0%,#ffffff_0%,transparent_60%)]" />
      <GrowthCurve
        width={1440}
        height={260}
        animate={false}
        strokeWidth={1.5}
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 w-full opacity-[0.12]"
        id="page-hero-curve"
      />

      <div className="container-x">
        <Reveal>
          <Breadcrumbs items={crumbs} />
        </Reveal>
        <Reveal delay={0.05}>
          <Eyebrow className="mt-7">{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-7 max-w-4xl text-[clamp(2.4rem,1.4rem+3.6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
            {title}
          </h1>
        </Reveal>
        {lead && (
          <Reveal delay={0.15}>
            <p className="mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-muted md:text-lg">
              {lead}
            </p>
          </Reveal>
        )}
        {children && (
          <Reveal delay={0.2}>
            <div className="mt-10">{children}</div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
