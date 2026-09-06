import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { CardEngagement } from "@/components/engagement/engagement-bar";
import { works } from "@/config/site";

/**
 * A case study, as a card.
 *
 * The card is an `<article>` with a stretched link over it rather than one big
 * `<a>`, because the like button lives inside it and a button nested in an
 * anchor is neither valid HTML nor clickable. The link covers the card through
 * its `::before`; the button sits above it on `z-10`.
 */
export function WorkCard({ work }: { work: (typeof works)[number] }) {
  const [headline, ...rest] = work.metrics;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/25 hover:shadow-lift">
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(150deg, ${work.accent}14 0%, ${work.accent}05 55%, transparent 100%)`,
        }}
      >
        <GrowthCurve
          width={640}
          height={300}
          animate={false}
          strokeWidth={2.5}
          fill
          id={`work-${work.slug}`}
          className="absolute inset-x-0 bottom-0 h-[78%] w-full transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-7">
          <div className="flex items-start justify-between">
            <span className="label rounded-full border border-line bg-surface/80 px-3 py-1.5 text-ink-soft backdrop-blur">
              {work.category}
            </span>
            <span className="label text-muted">{work.year}</span>
          </div>
          <div>
            <p className="font-display text-[clamp(2.2rem,1.6rem+1.8vw,3.2rem)] font-extrabold leading-none tracking-[-0.05em] text-ink">
              {headline.value}
            </p>
            <p className="mt-1.5 text-sm text-muted">{headline.label}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-start justify-between gap-4">
          <p className="label text-violet">{work.client}</p>
          <ArrowUpRight className="size-5 shrink-0 text-muted transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet" />
        </div>
        <h3 className="mt-3 font-display text-xl font-bold leading-snug tracking-tight text-ink">
          <Link href={`/case-studies/${work.slug}`} className="before:absolute before:inset-0">
            {work.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">{work.summary}</p>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line-soft pt-5">
          {rest.slice(0, 2).map((m) => (
            <div key={m.label}>
              <dt className="text-xs text-muted">{m.label}</dt>
              <dd className="font-display text-base font-bold text-ink">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex border-t border-line-soft pt-4">
          <CardEngagement kind="CASE_STUDY" slug={work.slug} />
        </div>
      </div>
    </article>
  );
}
