import type { Post } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";

/**
 * A listing of posts: an optional lead story across the full width, then the
 * rest three to a row, as the home page lays out its project tiles.
 */
export function PostGrid({ posts, lead }: { posts: Post[]; lead?: Post | null }) {
  const rest = lead ? posts.filter((p) => p.slug !== lead.slug) : posts;
  return (
    <>
      {lead && (
        <div className="featured-slot reveal">
          <PostCard post={lead} featured />
        </div>
      )}
      {rest.length > 0 && (
        <ul className="cards">
          {rest.map((post) => (
            <li key={post.slug} className="reveal">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
