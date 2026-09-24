import type { AnchorHTMLAttributes } from "react";

/** Link that opens outside the site in a new tab. */
export function ExternalLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}
