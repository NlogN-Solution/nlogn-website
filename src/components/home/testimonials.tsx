import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/config/site";

function Card({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <figure className="flex w-[340px] shrink-0 flex-col justify-between rounded-[24px] border border-line bg-surface p-8 shadow-soft md:w-[420px]">
      <Quote className="size-6 text-violet-soft" aria-hidden />
      <blockquote className="mt-5 font-display text-[1.0625rem] font-medium leading-relaxed tracking-[-0.015em] text-ink">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-3 border-t border-line-soft pt-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-wash font-display text-xs font-bold text-violet-deep">
          {t.initials}
        </span>
        <span className="text-sm">
          <span className="block font-semibold text-ink">{t.name}</span>
          <span className="block text-muted">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const loop = [...testimonials, ...testimonials];
  return (
    <section className="py-16 md:py-28" aria-label="Client testimonials">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Client reviews"
          title={
            <>
              What our clients <span className="text-gradient-violet">actually say</span>
            </>
          }
          lead="Websites and software, yes — and the content, campaigns and films that run alongside them."
        />
      </div>

      <div className="group relative mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
        <ul className="flex w-max gap-5 animate-marquee group-hover:[animation-play-state:paused]">
          {loop.map((t, i) => (
            <li key={`${t.name}-${i}`} aria-hidden={i >= testimonials.length}>
              <Card t={t} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
