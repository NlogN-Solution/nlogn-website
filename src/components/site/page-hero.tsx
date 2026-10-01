import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { name: string; path: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {items.map((item, i) => (
          <li key={item.path}>
            {i === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.path}>{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * The opening of every inner page, in the home page's hero language: a
 * breadcrumb and eyebrow on one rule, a large Space Grotesk title, then the
 * lead and any actions on a hairline below it. Accent words go in <em>.
 *
 * `lead` may hold several paragraphs separated by a blank line. `chips` sit
 * under the title instead of the lead row (category filters); `children` are
 * actions, set on the right of the lead.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  long = false,
  chips,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  crumbs: Crumb[];
  /** A longer title, set a size down so it still fits in three lines. */
  long?: boolean;
  chips?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const paragraphs = lead?.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) ?? [];

  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="section-top">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow">{eyebrow}</p>
        </div>
        <h1 className={cn("page-title", long && "is-long")}>{title}</h1>
        {(paragraphs.length > 0 || children) && (
          <div className="page-hero-foot">
            <div className="page-lead">
              {paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {children && <div className="page-hero-actions">{children}</div>}
          </div>
        )}
        {chips && <div className="chips">{chips}</div>}
      </div>
    </section>
  );
}
