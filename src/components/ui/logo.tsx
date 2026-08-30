import Link from "next/link";
import { LOGO } from "@/components/ui/logo-paths";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** "full" is the stacked mark + wordmark lockup; "mark" is the glyph pair alone. */
  variant?: "full" | "mark";
  /** Inverted for a dark surface, ink for the light pages. */
  tone?: "ink" | "invert";
  href?: string | null;
};

export function LogoGlyph({
  variant = "full",
  tone = "ink",
  className,
}: Pick<Props, "variant" | "tone" | "className">) {
  const full = variant === "full";
  const box = full ? LOGO.lockup : LOGO.mark;
  const letters = tone === "invert" ? "#ffffff" : "var(--color-ink)";

  return (
    <svg
      viewBox={`0 0 ${box.w} ${box.h}`}
      className={className}
      role="img"
      aria-label="nlogn"
      fill="none"
    >
      <path
        d={full ? LOGO.paths.lockupMark : LOGO.paths.markGlyphs}
        fill={letters}
        fillRule="evenodd"
      />
      <path
        d={full ? LOGO.paths.lockupDots : LOGO.paths.markDots}
        fill="url(#logo-dots)"
        fillRule="evenodd"
      />
      {full && <path d={LOGO.paths.lockupWord} fill={letters} fillRule="evenodd" />}
      <defs>
        <linearGradient id="logo-dots" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6c47ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className, variant = "full", tone = "ink", href = "/" }: Props) {
  const glyph = (
    <LogoGlyph
      variant={variant}
      tone={tone}
      className={cn(
        "w-auto transition-opacity duration-300 group-hover:opacity-80",
        variant === "full" ? "h-10 md:h-11" : "h-7",
      )}
    />
  );

  if (href === null) return <span className={cn("inline-flex", className)}>{glyph}</span>;

  return (
    <Link
      href={href}
      aria-label="nlogn — home"
      className={cn("group inline-flex items-center", className)}
    >
      {glyph}
    </Link>
  );
}
