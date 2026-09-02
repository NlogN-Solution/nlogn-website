import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { STATUS_LABEL, type SoftwareProduct, type SoftwareStatus } from "@/config/software";
import { cn } from "@/lib/utils";

/**
 * A software product, shown in the Software tab and on /software.
 *
 * The whole card is one link to the write-up. Products with a screenshot show
 * it inside app chrome; products still being built draw a poster from their
 * monogram and accent instead, so nothing on the page is a mocked-up UI shot.
 */

const statusStyles: Record<SoftwareStatus, string> = {
  live: "border-emerald-600/25 bg-emerald-500/10 text-emerald-700",
  beta: "border-violet/30 bg-violet-wash text-violet-deep",
  development: "border-amber-600/25 bg-amber-500/10 text-amber-700",
};

export function StatusPill({
  status,
  className,
}: {
  status: SoftwareStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        statusStyles[status],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "live" && "bg-emerald-600",
          status === "beta" && "bg-violet",
          status === "development" && "bg-amber-600",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Stands in for a screenshot on a product that has no interface to show yet. */
function ProductPoster({ product }: { product: SoftwareProduct }) {
  return (
    <div
      className="relative size-full overflow-hidden"
      style={{ background: `linear-gradient(150deg, ${product.accent}14 0%, transparent 55%)` }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(80% 70% at 30% 20%, #000 0%, transparent 75%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center gap-5 p-8 md:p-10">
        <span
          className="grid size-14 place-items-center rounded-2xl font-display text-lg font-extrabold tracking-[-0.04em] text-white shadow-lift"
          style={{ backgroundColor: product.accent }}
        >
          {product.monogram}
        </span>
        <div className="space-y-2.5">
          <span className="block h-2.5 w-2/5 rounded-full bg-line" />
          <span className="block h-2.5 w-3/5 rounded-full bg-line-soft" />
          <span className="block h-2.5 w-1/3 rounded-full bg-line-soft" />
        </div>
      </div>
    </div>
  );
}

export function SoftwareCard({ product }: { product: SoftwareProduct }) {
  return (
    <Link
      href={`/software/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift"
    >
      {/* app chrome, so the shot reads as a running product rather than an image */}
      <div className="flex min-w-0 items-center gap-2 border-b border-line bg-canvas px-4 py-3.5 sm:px-5">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-line" />
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-line" />
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-line" />
        {/* The URL pill repeats the product name shown below, so on a narrow
            phone it steps aside rather than forcing the card past the screen. */}
        <span className="ml-3 hidden min-w-0 truncate rounded-full bg-surface px-3 py-1 font-mono text-[0.6875rem] text-muted sm:block">
          {product.name.toLowerCase()}
        </span>
        <StatusPill status={product.status} className="ml-auto shrink-0 !text-[0.625rem]" />
      </div>

      <div className="relative aspect-[2/1] overflow-hidden bg-canvas-2">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={`${product.name} — ${product.tagline}`}
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 34rem"
            className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
          />
        ) : (
          <ProductPoster product={product} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-7 md:p-8">
        <p className="label text-violet">{product.sector}</p>
        <h3 className="mt-3 font-display text-xl font-bold tracking-[-0.03em] text-ink">
          {product.name}
        </h3>
        <p className="mt-1 text-[0.9375rem] font-medium text-violet-deep">{product.tagline}</p>
        <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-muted">{product.summary}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {product.stack.slice(0, 4).map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink-soft"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-center justify-between border-t border-line-soft pt-5">
          <span className="font-display text-[0.9375rem] font-semibold text-ink">
            Read the write-up
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-5 text-muted transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-violet"
          />
        </div>
      </div>
    </Link>
  );
}
