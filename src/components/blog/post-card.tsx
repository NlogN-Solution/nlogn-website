import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/lib/blog";
import { formatDate, slugify, cn } from "@/lib/utils";

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[24px] border border-line bg-surface p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/25 hover:shadow-lift",
        featured && "md:p-10",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="label rounded-full bg-violet-wash px-3 py-1.5 text-violet-deep">
          {post.category}
        </span>
        <span className="text-xs text-muted">{post.readingMinutes} min read</span>
      </div>

      <h3
        className={cn(
          "mt-6 font-display font-bold leading-snug tracking-tight text-ink",
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
    </article>
  );
}
