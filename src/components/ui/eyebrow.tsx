import { cn } from "@/lib/utils";

/** Pill eyebrow with a live-dot — marks the start of a section. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-4 py-2 backdrop-blur",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
      </span>
      <span className="label text-ink-soft">{children}</span>
    </span>
  );
}
