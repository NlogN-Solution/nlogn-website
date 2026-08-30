import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/blog/post-card";
import { getAllPosts } from "@/lib/blog";

export function BlogPreview() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-line bg-surface py-16 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="The Growth Brief"
          title={
            <>
              What we have learned, <span className="text-gradient-violet">written down</span>
            </>
          }
          lead="Field notes from real engagements: what worked, what did not, and the numbers underneath both."
          action={
            <Button href="/blog" variant="secondary" arrow>
              Read the blog
            </Button>
          }
        />

        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal as="li" key={post.slug} delay={i * 0.08} className="h-full">
              <PostCard post={post} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
