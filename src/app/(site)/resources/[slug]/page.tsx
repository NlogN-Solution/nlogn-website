import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Download, Code2, ExternalLink, Scale } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleContent } from "@/components/blog/article-content";
import { ResourceGate } from "@/components/resources/resource-gate";
import { ResourceCard } from "@/components/resources/resource-card";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { ProtectedImage } from "@/components/ui/protected-image";
import {
  RESOURCE_TYPE_LABELS,
  resourceCtaLabel,
  resourceDestination,
} from "@/config/resources";
import {
  getPublishedResource,
  getPublishedResourceSlugs,
  getPublishedResources,
  type PublicResource,
} from "@/server/services/resource.service";

/**
 * One resource.
 *
 * The order of this page is the whole conversion argument: what it is, what is
 * inside it, the licence — and only then the gate. A visitor who arrives from a
 * reel has seen fifteen seconds of video and knows nothing; asking for an email
 * above the fold is asking them to pay before they have been shown anything.
 */

export const revalidate = 60;

/**
 * Published slugs are prerendered at build time; anything published afterwards
 * renders on first request and is then held for `revalidate`. `dynamicParams`
 * stays at its default of true precisely so a resource created after the last
 * deploy still answers.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedResourceSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublishedResource(slug);

  if (!resource) {
    return buildMetadata({
      title: "Resource not found",
      description: "That resource is not available.",
      path: `/resources/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: resource.seoTitle ?? `${resource.title} — free download`,
    description:
      resource.seoDescription ??
      resource.summary ??
      `${RESOURCE_TYPE_LABELS[resource.type]} from the nlogn resource library.`,
    path: `/resources/${resource.slug}`,
    image: resource.ogImageUrl ?? resource.coverUrl ?? undefined,
    noIndex: resource.noIndex,
  });
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getPublishedResource(slug);
  if (!resource) notFound();

  const all = await getPublishedResources();
  const related = all.filter((item) => item.slug !== resource.slug).slice(0, 3);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Resources", path: "/resources" },
    { name: resource.title, path: `/resources/${resource.slug}` },
  ];

  /*
   * No views, likes or comments here, and that is deliberate rather than
   * unfinished. A library page has one job — get the visitor to the repository
   * — and a social row beside that button is a second thing to press. The
   * engagement ledger still runs for blogs, insights and case studies, where
   * the conversation is the point.
   */
  return (
    <>
      <PageHero
        eyebrow={RESOURCE_TYPE_LABELS[resource.type]}
        title={resource.title}
        lead={resource.summary ?? undefined}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap items-center gap-2">
          {resource.version && (
            <span className="label rounded-full border border-line px-3 py-1.5 text-muted">
              {resource.version}
            </span>
          )}
          {resource.licence && (
            <span className="label inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-muted">
              <Scale className="size-3.5" aria-hidden />
              {resource.licence}
            </span>
          )}
          {resource.downloads > 0 && (
            <span className="label inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-muted">
              <Download className="size-3.5" aria-hidden />
              {resource.downloads.toLocaleString("en-GB")} downloads
            </span>
          )}
        </div>
      </PageHero>

      <div className="container-x py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div className="min-w-0">
            {resource.coverUrl && (
              <Reveal>
                {/* Not saveable by right-click or long-press — see
                    `ProtectedImage` for what that does and does not buy. */}
                <ProtectedImage
                  src={resource.coverUrl}
                  alt={resource.coverAlt ?? ""}
                  wrapperClassName="overflow-hidden rounded-[26px] border border-line bg-canvas"
                  className="w-full object-cover"
                />
              </Reveal>
            )}

            {resource.includes.length > 0 && (
              <Reveal delay={0.05}>
                <section className={resource.coverUrl ? "mt-12" : ""}>
                  <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-ink">
                    What&rsquo;s inside
                  </h2>
                  <ul className="mt-5 space-y-3">
                    {resource.includes.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-soft"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            )}

            {resource.descriptionHtml && (
              <Reveal delay={0.1}>
                <ArticleContent html={resource.descriptionHtml} className="mt-12" />
              </Reveal>
            )}

            {resource.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2 border-t border-line-soft pt-8">
                {resource.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="rounded-full border border-line px-3 py-1.5 text-[0.8125rem] text-muted"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* The gate, or the door if there is no gate. Sticky on desktop so it
              stays reachable while the description is read; in normal flow on a
              phone, where a sticky panel would eat the viewport. */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Access resource={resource} />

            {resource.demoUrl && (
              <a
                href={resource.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-violet/40"
              >
                See it running
                <ExternalLink className="size-4" aria-hidden />
              </a>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-line pt-16 md:mt-28">
            <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-extrabold tracking-[-0.035em] text-ink">
              More from the library
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal as="li" key={item.slug} delay={index * 0.06} className="h-full">
                  <ResourceCard resource={item} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-16">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to all resources
          </Link>
        </p>
      </div>

      <CtaBand title="Want this built properly, for you?" />

      <JsonLd
        schema={[
          breadcrumbSchema(crumbs),
          {
            "@type": resource.type === "REPO" ? "SoftwareSourceCode" : "CreativeWork",
            name: resource.title,
            description: resource.summary ?? undefined,
            url: absoluteUrl(`/resources/${resource.slug}`),
            datePublished: resource.publishedAt ?? undefined,
            license: resource.licence ?? undefined,
            codeRepository: resource.repoUrl ?? undefined,
            isPartOf: { "@id": absoluteUrl("/#website") },
            // Stating the price is what earns the "free" label in a rich
            // result. Omitting it on a gated resource is deliberate: an email
            // is a cost, and claiming otherwise in structured data is the kind
            // of thing that gets a site's markup ignored.
            ...(resource.gate === "FREE"
              ? { isAccessibleForFree: true, offers: { "@type": "Offer", price: 0, priceCurrency: "USD" } }
              : {}),
          },
        ]}
        id="resource-schema"
      />
    </>
  );
}

/**
 * What the visitor is offered, which is decided by the gate and by where the
 * thing actually lives.
 *
 * The button names its destination rather than always saying "Download": a
 * resource with a repository URL sends people to GitHub, and labelling that
 * click as a download is the kind of small lie that gets the tab closed. The
 * label comes from `resourceCtaLabel` and the destination from
 * `resourceDestination` — the same pair the delivery route uses — so the promise
 * and the redirect cannot drift apart.
 *
 * A FREE resource shows its destination as an ordinary link: the repo URL is
 * public, and putting a form in front of a URL that will be re-posted in the
 * comments buys nothing and costs the click.
 */
function Access({ resource }: { resource: PublicResource }) {
  const delivery = resourceDestination({
    repo: resource.hasRepo,
    external: resource.hasExternal,
    file: resource.hasFile,
  });
  const label = resourceCtaLabel(delivery, resource.type, resource.fileLabel);
  const Icon = delivery === "repo" ? Code2 : delivery === "external" ? ExternalLink : Download;
  // A redirect off this site opens in its own tab; a streamed file must not,
  // or the visitor is left staring at a blank one.
  const leavesTheSite = delivery === "repo" || delivery === "external";

  if (resource.gate === "FREE") {
    const href =
      delivery === "repo"
        ? resource.repoUrl
        : delivery === "external"
          ? resource.externalUrl
          : delivery === "file"
            ? `/api/resources/file/${resource.slug}`
            : null;

    if (!href) return null;

    return (
      <div className="rounded-[22px] border border-violet/30 bg-violet-wash p-7 md:p-8">
        <p className="font-display text-lg font-bold tracking-[-0.02em] text-ink">
          Yours, no email needed
        </p>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
          Take it, fork it, ship it. If it saves you an afternoon, tell someone where you got it.
        </p>
        <a
          href={href}
          {...(leavesTheSite ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </a>
      </div>
    );
  }

  if (resource.gate === "ACCOUNT") {
    // Should be unreachable: publishing validation rejects this. Rendered
    // honestly rather than as a broken form if one ever slips through.
    return (
      <div className="rounded-[22px] border border-line bg-surface p-7 md:p-8">
        <p className="font-display text-lg font-bold tracking-[-0.02em] text-ink">Coming soon</p>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
          This one is not available to download yet.{" "}
          <Link href="/contact" className="text-violet underline-offset-4 hover:underline">
            Ask us for it
          </Link>{" "}
          and we will send it over.
        </p>
      </div>
    );
  }

  return (
    <>
      <ResourceGate slug={resource.slug} buttonLabel={label} destination={delivery} />
      <p className="mt-4 flex items-start gap-2 px-1 text-[0.8125rem] leading-relaxed text-muted">
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-violet" aria-hidden />
        Already unlocked this? Enter the same address and we&rsquo;ll send a fresh link.
      </p>
    </>
  );
}
