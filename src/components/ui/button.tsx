import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "violet";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 rounded-[0.9rem] font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-white shadow-soft hover:shadow-lift hover:-translate-y-0.5 hover:bg-[#1a1a22] active:shadow-inset",
  violet:
    "bg-violet text-white shadow-[-4px_-4px_12px_rgba(255,255,255,0.5),6px_10px_26px_-8px_rgba(108,71,255,0.65)] hover:-translate-y-0.5 hover:bg-violet-deep active:shadow-inset",
  secondary:
    "bg-surface text-ink border border-line shadow-soft-sm hover:border-ink/20 hover:-translate-y-0.5 hover:shadow-soft active:shadow-inset",
  ghost: "text-ink hover:bg-ink/5 active:shadow-inset",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-[3.45rem] px-8 text-base",
};

/** With a badge the right edge tightens up so the disc sits inside the shape. */
const badgeSizes: Record<Size, string> = {
  sm: "pr-1.5",
  md: "pr-2",
  lg: "pr-2",
};

const badgeDiscs: Record<Size, string> = {
  sm: "size-7",
  md: "size-9",
  lg: "size-11",
};

type Props = {
  href?: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  /** The violet disc with a diagonal arrow, as on the hero's primary call. */
  badge?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  badge = false,
  className,
  children,
  ...props
}: Props) {
  const classes = cn(
    base,
    variants[variant],
    sizes[size],
    badge && badgeSizes[size],
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      {badge && (
        <span
          aria-hidden
          className={cn(
            "ml-1 grid shrink-0 place-items-center rounded-full bg-violet text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45",
            badgeDiscs[size],
          )}
        >
          <ArrowUpRight className="size-[45%]" strokeWidth={2.2} />
        </span>
      )}
      {arrow && !badge && (
        <ArrowRight
          className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      )}
    </>
  );

  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel");
    if (external) {
      return (
        <a href={href} className={classes} rel="noopener noreferrer">
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {inner}
    </button>
  );
}
