import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/blog/post-card";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getLead, getPostsByKind } from "@/lib/blog";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Insights — the thinking behind the work",
  description:
    "Long-form pieces on why sites fail to convert, what an audit should find before anyone writes code, and which performance work actually pays. Written from real engagements.",
  path: "/insights",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Insights", path: "/insights" },
];

export default function InsightsPage() {
  const posts = getPostsByKind("insight");
  const lead = getLead(posts);
  const rest = posts.filter((p) => p.slug !== lead?.slug);

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title={
          <>
            The thinking <span className="text-gradient-violet">behind the work</span>
          </>
        }
        lead="Longer pieces on the decisions that move a number — what to diagnose first, what an audit should surface, and which work compounds. Fewer of them, and each one argued properly."
        crumbs={crumbs}
      >
        <Button href="/blog" variant="secondary" arrow>
          Shorter posts on the blog
        </Button>
      </PageHero>

      <div className="container-x py-16 md:py-24">
        {lead && (
          <Reveal>
            <div className="mb-5">
              <PostCard post={lead} featured />
            </div>
          </Reveal>
        )}

        {rest.length > 0 && (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal as="li" key={post.slug} delay={(i % 3) * 0.07} className="h-full">
                <PostCard post={post} />
              </Reveal>
            ))}
          </ul>
        )}

        <Reveal>
          <div className="mt-16 grid gap-8 rounded-[26px] border border-line bg-surface p-9 md:grid-cols-[1.3fr_1fr] md:items-center md:p-12">
            <div>
              <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-extrabold tracking-tight text-ink">
                One essay a month. No pitch.
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                The Growth Brief goes out to 2,400 founders and marketing leads. Unsubscribe
                in one click, and we never sell the list.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </Reveal>
      </div>

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": "CollectionPage",
            name: "Insights",
            url: absoluteUrl("/insights"),
            isPartOf: { "@id": absoluteUrl("/#website") },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/blog/${p.slug}`),
                name: p.title,
              })),
            },
          },
        ]}
        id="insights-schema"
      />
    </>
  );
}
