"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Heading = { id: string; text: string; level: number };

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <p className="label text-muted">On this page</p>
      <ul className="mt-5 space-y-2.5 border-l border-line">
        {headings.map((h) => (
          <li key={h.id} className={cn(h.level === 3 && "pl-4")}>
            <a
              href={`#${h.id}`}
              className={cn(
                "-ml-px block border-l-2 pl-4 text-sm leading-snug transition-colors",
                active === h.id
                  ? "border-violet font-medium text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
