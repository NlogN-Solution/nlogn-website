import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { PostGrid } from "@/components/blog/post-grid";
import { SignupBand } from "@/components/site/signup-band";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getLead } from "@/lib/blog";
import { getMergedPosts } from "@/server/public-content";
import { absoluteUrl } from "@/lib/utils";
import { EngagementProvider } from "@/components/engagement/provider";
import { engagementKey, kindFromPost } from "@/lib/engagement";

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

export const revalidate = 60;

export default async function InsightsPage() {
  const posts = await getMergedPosts("insight");
  const lead = getLead(posts);

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title={
          <>
            The thinking <em>behind the work.</em>
          </>
        }
        lead="Longer pieces on the decisions that move a number — what to diagnose first, what an audit should surface, and which work compounds. Fewer of them, and each one argued properly."
        crumbs={crumbs}
      >
        <Button href="/blog" variant="secondary" arrow>
          Shorter posts on the blog
        </Button>
      </PageHero>

      <EngagementProvider keys={posts.map((p) => engagementKey(kindFromPost(p.kind), p.slug))}>
        <section className="page-section">
          <div className="wrap">
            <PostGrid posts={posts} lead={lead} />
            <SignupBand />
          </div>
        </section>
      </EngagementProvider>
      <CtaBand
        title={
          <>
            Want this done <em>to your site?</em>
          </>
        }
      />

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
