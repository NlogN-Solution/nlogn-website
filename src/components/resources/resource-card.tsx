import Link from "next/link";
import { RESOURCE_TYPE_CHIPS } from "@/config/resources";
import { ProtectedImage } from "@/components/ui/protected-image";
import type { PublicResource } from "@/server/services/resource.service";

/**
 * One item on the library shelf, as the home page's project tile.
 *
 * The gate is stated on the card rather than discovered after the click. A
 * visitor who arrives from a reel expecting a free repo and meets a form has
 * been misled by the card, and that costs more than the email was worth.
 *
 * No views, likes or comments: the library's job is to get somebody to a
 * repository, and a social row is a second thing to press on the way there.
 */
export function ResourceCard({ resource }: { resource: PublicResource }) {
  const gated = resource.gate !== "FREE";
  const type = RESOURCE_TYPE_CHIPS[resource.type];

  return (
    <article className="card">
      {resource.coverUrl ? (
        <ProtectedImage
          src={resource.coverUrl}
          alt={resource.coverAlt ?? ""}
          loading="lazy"
          wrapperClassName="card-media"
        />
      ) : (
        <div className="card-media is-word" aria-hidden="true">
          <span>
            {type}
            <span>{resource.version}</span>
          </span>
          <strong>{type}</strong>
        </div>
      )}

      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{type}</span>
          {resource.version && <span>{resource.version}</span>}
        </div>
        <h3>
          <Link href={`/resources/${resource.slug}`}>{resource.title}</Link>
        </h3>
        {resource.summary && <p>{resource.summary}</p>}

        <div className="card-foot">
          <span>{gated ? "Email required" : "No email needed"}</span>
          {resource.downloads > 0 && (
            <span>{resource.downloads.toLocaleString("en-GB")} downloads</span>
          )}
        </div>
      </div>
    </article>
  );
}
