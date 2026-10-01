import { cn } from "@/lib/utils";

/** Section eyebrow — the home page's tracked uppercase label (`.eyebrow`). */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("eyebrow inline-block", className)}>{children}</span>;
}
