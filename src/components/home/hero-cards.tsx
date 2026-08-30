import { cn } from "@/lib/utils";

type Card = {
  label: string;
  value: string;
  meta: string;
  tone: "glass" | "solid";
  status?: boolean;
  /** Parallax travel in px at full pointer deflection. */
  depth: number;
  position: string;
  float: string;
};

/**
 * Interface elements that read as physical glass panels sitting in the same
 * space as the core — not dashboard widgets pinned to the page.
 */
const cards: Card[] = [
  {
    label: "AI Automation",
    value: "24/7 workflows",
    meta: "Active",
    tone: "glass",
    status: true,
    depth: 26,
    position: "left-[-2%] top-[15%]",
    float: "0s",
  },
  {
    label: "Digital Growth",
    value: "+240%",
    meta: "6 month growth",
    tone: "solid",
    depth: 16,
    position: "right-[-1%] top-[45%]",
    float: "1.6s",
  },
  {
    label: "SEO",
    value: "+184%",
    meta: "Organic traffic",
    tone: "glass",
    depth: 34,
    position: "bottom-[13%] left-[7%]",
    float: "0.9s",
  },
  {
    label: "Software",
    value: "Custom system",
    meta: "Deployed",
    tone: "glass",
    depth: 20,
    position: "right-[10%] top-[4%] hidden xl:block",
    float: "2.4s",
  },
];

export function HeroCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn("absolute", card.position)}
          style={{
            transform:
              "translate3d(calc(var(--px, 0) * var(--depth) * 1px), calc(var(--py, 0) * var(--depth) * 1px), 0)",
            ["--depth" as string]: card.depth,
            transition: "transform 700ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <article
            className={cn(
              "min-w-[9.5rem] rounded-2xl px-5 py-4 animate-float",
              card.tone === "solid"
                ? "bg-white text-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]"
                : "border border-white/12 bg-white/[0.055] text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl",
            )}
            style={{ animationDelay: card.float, animationDuration: "11s" }}
          >
            <p
              className={cn(
                "label",
                card.tone === "solid" ? "text-violet-deep" : "text-violet-soft",
              )}
            >
              {card.label}
            </p>
            <p
              className={cn(
                "mt-2.5 font-display font-extrabold tracking-[-0.035em]",
                card.value.startsWith("+") ? "text-[1.75rem] leading-none" : "text-[1.0625rem]",
              )}
            >
              {card.value}
            </p>
            <p
              className={cn(
                "mt-1.5 flex items-center gap-2 text-[0.78rem]",
                card.tone === "solid" ? "text-muted" : "text-white/50",
              )}
            >
              {card.status && (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
              {card.meta}
            </p>
          </article>
        </div>
      ))}
    </div>
  );
}

/** Compact metric row used in place of the floating cards on small screens. */
export function HeroMetrics() {
  return (
    <ul className="grid grid-cols-3 gap-3 lg:hidden">
      {[
        { value: "+240%", label: "6 month growth" },
        { value: "+184%", label: "Organic traffic" },
        { value: "24/7", label: "AI workflows" },
      ].map((m) => (
        <li
          key={m.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-xl"
        >
          <p className="font-display text-[1.4rem] font-extrabold leading-none tracking-[-0.04em] text-white">
            {m.value}
          </p>
          <p className="mt-2 text-[0.78rem] leading-snug text-white/50">{m.label}</p>
        </li>
      ))}
    </ul>
  );
}
