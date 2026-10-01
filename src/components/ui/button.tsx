import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "violet";
type Size = "sm" | "md" | "lg";

/*
 * The home page's buttons (`.button` in landing.css): square, flat, a long
 * gap before the arrow and a small lift on hover. `primary` and `violet` are
 * the blue fill, `secondary` the outlined one, `ghost` the underlined
 * `.text-link`. These classes are landing styles, so they render the same
 * inside a Tailwind island.
 */
const variants: Record<Variant, string> = {
  primary: "button blue",
  violet: "button blue",
  secondary: "button outline",
  ghost: "text-link",
};

const sizes: Record<Size, string> = {
  sm: "is-sm",
  md: "",
  lg: "",
};

type Props = {
  href?: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  /** Same as `arrow`; kept so existing call sites need no change. */
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
  const classes = cn(variants[variant], variant !== "ghost" && sizes[size], className);
  const inner = (
    <>
      {children}
      {(arrow || badge) && <span aria-hidden="true">↗</span>}
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
