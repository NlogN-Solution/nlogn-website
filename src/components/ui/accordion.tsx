import { Plus } from "lucide-react";

/**
 * Native details/summary: answers stay in the DOM for crawlers and screen
 * readers, and the whole thing works before JavaScript loads.
 */
export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-[1.0625rem] font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-violet-deep md:text-lg">
              {item.q}
            </h3>
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink transition-all duration-300 group-open:rotate-45 group-open:border-violet group-open:bg-violet group-open:text-white">
              <Plus className="size-4" aria-hidden />
            </span>
          </summary>
          <p className="max-w-3xl pb-7 pr-12 text-[0.9375rem] leading-relaxed text-muted">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
