import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/blog";
import { CardEngagement } from "@/components/engagement/engagement-bar";
import { kindFromPost } from "@/lib/engagement";
import { formatDate, slugify, cn } from "@/lib/utils";

/**
 * One post, as a card — the home page's project tile: artwork, then the
 * category tag, a Space Grotesk title and a hairline footer.
 *
 * The artwork comes from the post's own frontmatter (`image`), so a card, the
 * article header and any listing all show the same picture. Without one, the
 * frame shows the category as a word mark rather than a placeholder.
 *
 * The title link is stretched over the card; the like button sits above it in
 * a small Tailwind island, since a button inside a link is not clickable.
 */
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={cn("card", featured && "is-featured")}>
      {post.image ? (
        <div className="card-media">
          <Image
            src={post.image}
            alt={post.imageAlt ?? post.title}
            fill
            sizes={featured ? "(max-width: 1000px) 92vw, 50vw" : "(max-width: 700px) 92vw, (max-width: 1000px) 46vw, 30vw"}
          />
          <span className="round-arrow" aria-hidden="true">
            ↗
          </span>
        </div>
      ) : (
        <div className="card-media is-word" aria-hidden="true">
          <span>
            {post.category}
            <span>{post.readingMinutes} min</span>
          </span>
          <strong>{post.category.split(" ")[0]}</strong>
        </div>
      )}

      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{post.category}</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.description}</p>

        {featured && post.tags.length > 0 && (
          <ul className="card-tags">
            {post.tags.slice(0, 4).map((tag) => (
              <li key={tag}>
                <Link className="chip" href={`/blog/tag/${slugify(tag)}`}>
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="card-foot">
          <span>
            {post.author} · <time dateTime={post.date}>{formatDate(post.date)}</time>
          </span>
          <div className="site-theme">
            <CardEngagement kind={kindFromPost(post.kind)} slug={post.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}
