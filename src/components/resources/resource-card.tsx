import Link from "next/link";
import { ArrowUpRight, Download, Lock, Unlock } from "lucide-react";
import { RESOURCE_TYPE_CHIPS } from "@/config/resources";
import { ProtectedImage } from "@/components/ui/protected-image";
import type { PublicResource } from "@/server/services/resource.service";

/**
 * One item on the library shelf.
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

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift"
    >
      {resource.coverUrl && (
        <ProtectedImage
          src={resource.coverUrl}
          alt={resource.coverAlt ?? ""}
          loading="lazy"
          wrapperClassName="aspect-[16/9] overflow-hidden bg-canvas"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}

      <div className="flex flex-1 flex-col p-7 md:p-8">
        <div className="flex items-center gap-2">
          <span className="label rounded-full bg-violet-wash px-2.5 py-1 text-violet">
            {RESOURCE_TYPE_CHIPS[resource.type]}
          </span>
          {resource.version && (
            <span className="label rounded-full border border-line px-2.5 py-1 text-muted">
              {resource.version}
            </span>
          )}
          <ArrowUpRight
            aria-hidden
            className="ml-auto size-5 text-muted transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet"
          />
        </div>

        <h3 className="mt-5 font-display text-lg font-bold leading-snug tracking-[-0.03em] text-ink">
          {resource.title}
        </h3>

        {resource.summary && (
          <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
            {resource.summary}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3 border-t border-line-soft pt-5 text-[0.8125rem] text-muted">
          <span className="inline-flex items-center gap-1.5">
            {gated ? (
              <Lock className="size-3.5 text-violet" aria-hidden />
            ) : (
              <Unlock className="size-3.5 text-violet" aria-hidden />
            )}
            {gated ? "Email required" : "No email needed"}
          </span>
          {resource.downloads > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Download className="size-3.5" aria-hidden />
              {resource.downloads.toLocaleString("en-GB")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
