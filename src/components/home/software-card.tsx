import Image from "next/image";
import Link from "next/link";
import { STATUS_LABEL, type SoftwareProduct, type SoftwareStatus } from "@/config/software";
import { cn } from "@/lib/utils";

/**
 * A software product, shown in the Software tab and on /software.
 *
 * The whole card is one link to the write-up. Products with a screenshot show
 * it inside app chrome; products still being built draw a poster from their
 * monogram and accent instead, so nothing on the page is a mocked-up UI shot.
 */

/**
 * A product's status, as the home page's `.tag` with a coloured dot. Landing
 * markup, so it renders the same in a landing section or a Tailwind island.
 */
const statusDot: Record<SoftwareStatus, string> = {
  live: "#1f9d55",
  beta: "#2563ff",
  development: "#d97706",
};

export function StatusPill({
  status,
  className,
}: {
  status: SoftwareStatus;
  className?: string;
}) {
  return (
    <span className={cn("tag status-tag", className)}>
      <span aria-hidden="true" style={{ background: statusDot[status] }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * A software product, shown on /software as the home page's project tile:
 * the screenshot (or the product's monogram on its accent) above the name,
 * tagline, summary and stack.
 */
export function SoftwareCard({ product, index = 0 }: { product: SoftwareProduct; index?: number }) {
  return (
    <article className="card">
      {product.thumbnail ? (
        <div className="card-media is-shot">
          <Image
            src={product.thumbnail}
            alt={`${product.name} — ${product.tagline}`}
            fill
            sizes="(max-width: 700px) 92vw, 46vw"
          />
          <span className="round-arrow" aria-hidden="true">
            ↗
          </span>
        </div>
      ) : (
        <div
          className="card-media is-word"
          style={
            {
              "--card-bg": index % 2 ? "#e0e4e3" : product.accent,
              "--card-fg": index % 2 ? "#1e292b" : "#ffffff",
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <span>
            {product.sector}
            <span>{STATUS_LABEL[product.status]}</span>
          </span>
          <strong>{product.name}</strong>
          <span className="round-arrow">↗</span>
        </div>
      )}

      <div className="card-body">
        <div className="card-meta">
          <StatusPill status={product.status} />
          <span>{product.sector}</span>
        </div>
        <h3>
          <Link href={`/software/${product.slug}`}>{product.name}</Link>
        </h3>
        <p>
          <b className="card-tagline">{product.tagline}</b> {product.summary}
        </p>
        <div className="card-foot">
          <span>{product.stack.slice(0, 4).join(" · ")}</span>
          <span>Read the write-up ↗</span>
        </div>
      </div>
    </article>
  );
}
