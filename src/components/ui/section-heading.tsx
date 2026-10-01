import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  /** Right-hand label on the eyebrow rule, as on the home page's sections. */
  aside?: React.ReactNode;
  title: React.ReactNode;
  lead?: string;
  className?: string;
  action?: React.ReactNode;
};

/**
 * A section opening in the home page's pattern: `.section-top` (eyebrow and
 * an aside on one line) above `.heading-row` (the heading, with the lead or an
 * action set against its baseline). Landing markup — use it in `.nlh`
 * sections, not inside a Tailwind island.
 */
export function SectionHeading({ eyebrow, aside, title, lead, className, action }: Props) {
  return (
    <div className={className}>
      {(eyebrow || aside) && (
        <div className="section-top">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {aside && (typeof aside === "string" ? <span className="eyebrow">{aside}</span> : aside)}
        </div>
      )}
      <div className={cn("heading-row reveal", !lead && !action && "is-single")}>
        <h2>{title}</h2>
        {lead && <p>{lead}</p>}
        {action}
      </div>
    </div>
  );
}
