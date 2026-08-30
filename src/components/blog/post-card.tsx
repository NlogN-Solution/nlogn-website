import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/lib/blog";
import { formatDate, slugify, cn } from "@/lib/utils";

/**
 * One post, as a card.
 *
 * The artwork comes from the post's own frontmatter (`image`), so a card, the
 * article header and any listing all show the same picture. A post without one
 * still renders — the frame is simply left out rather than filled with a
 * placeholder.
 */
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const alt = post.imageAlt ?? post.title;

  const art = post.image && (
    <div
      className={cn(
        "relative overflow-hidden bg-canvas-2",
        featured
          ? "aspect-[16/10] md:aspect-auto md:h-full md:min-h-[19rem]"
          : "aspect-[3/2] border-b border-line",
      )}
    >
      <Image
        src={post.image}
        alt={alt}
        fill
        sizes={
          featured
            ? "(max-width: 768px) 92vw, 42vw"
            : "(max-width: 768px) 92vw, (max-width: 1200px) 46vw, 26rem"
        }
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,11,15,0.10))]"
      />
    </div>
  );

  const body = (
    <div className={cn("flex flex-1 flex-col", featured ? "p-8 md:p-10" : "p-7")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="label rounded-full bg-violet-wash px-3 py-1.5 text-violet-deep">
          {post.category}
        </span>
        <span className="text-xs text-muted">{post.readingMinutes} min read</span>
      </div>

      <h3
        className={cn(
          "mt-5 font-display font-bold leading-snug tracking-tight text-ink",
          featured ? "text-[clamp(1.5rem,1.1rem+1.4vw,2.1rem)]" : "text-xl",
        )}
      >
        <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">
          {post.title}
        </Link>
      </h3>

      <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-muted">{post.description}</p>

      <div className="mt-7 flex items-center justify-between gap-4 border-t border-line-soft pt-5">
        <div className="text-sm">
          <p className="font-medium text-ink">{post.author}</p>
          <time dateTime={post.date} className="text-muted">
            {formatDate(post.date)}
          </time>
        </div>
        <ArrowUpRight className="size-5 text-muted transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet" />
      </div>

      {featured && post.tags.length > 0 && (
        <ul className="relative z-10 mt-5 flex flex-wrap gap-2">
          {post.tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              <Link
                href={`/blog/tag/${slugify(tag)}`}
                className="inline-block rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-violet/40 hover:text-violet"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const shell =
    "group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-surface transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/25 hover:shadow-lift";

  /* The lead card runs the artwork down one side on a wide screen, and stacks
     it above the copy on a narrow one. */
  if (featured && art) {
    return (
      <article className={cn(shell, "md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]")}>
        {art}
        {body}
      </article>
    );
  }

  return (
    <article className={shell}>
      {art}
      {body}
    </article>
  );
}
