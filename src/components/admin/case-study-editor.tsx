"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, Save, Send, X } from "lucide-react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { ImageField, MediaPicker, MediaThumb, type MediaItem } from "@/components/admin/media-picker";
import { PageHeader } from "@/components/admin/shell";
import {
  Banner,
  Button,
  Field,
  Input,
  Panel,
  PanelHeader,
  StatusBadge,
  Textarea,
  Toggle,
} from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

/**
 * The case study editor.
 *
 * A case study is a structured record, not an article, so this is a form of
 * discrete fields rather than one rich-text box — the public template reads
 * challenge, approach and metrics separately, and the numbers need to stay
 * numbers rather than becoming prose.
 */

export type CaseStudyRecord = {
  id: string;
  slug: string;
  status: string;
  featured: boolean;
  projectName: string;
  clientName: string;
  industry: string | null;
  projectType: string | null;
  shortDescription: string | null;
  summary: string | null;
  challenge: string | null;
  approach: unknown;
  solution: string | null;
  implementation: string | null;
  outcome: string | null;
  technologies: string[];
  servicesUsed: string[];
  clientObjective: string | null;
  metrics: unknown;
  timeline: string | null;
  year: string | null;
  accent: string | null;
  testimonialQuote: string | null;
  testimonialName: string | null;
  testimonialRole: string | null;
  heroMedia: MediaItem | null;
  thumbnail: MediaItem | null;
  gallery: MediaItem[];
  ogImage: MediaItem | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
};

type Metric = { value: string; label: string };

/** A list of short strings that can be reordered by editing in place. */
function StringList({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex min-w-0 gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas font-mono text-[0.6875rem] text-muted">
            {String(i + 1).padStart(2, "0")}
          </span>
          <Textarea
            rows={2}
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            aria-label={`Remove step ${i + 1}`}
            onClick={() => onChange(items.filter((_, index) => index !== i))}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <Button size="sm" icon={<Plus className="size-4" />} onClick={() => onChange([...items, ""])}>
        {addLabel}
      </Button>
    </div>
  );
}

export function CaseStudyEditor({ record }: { record?: CaseStudyRecord }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !record;

  const [projectName, setProjectName] = useState(record?.projectName ?? "");
  const [clientName, setClientName] = useState(record?.clientName ?? "");
  // Derived from client + project until someone edits it. See the article
  // editor for why this is not an effect.
  const [slugOverride, setSlugOverride] = useState<string | null>(record?.slug ?? null);
  const [industry, setIndustry] = useState(record?.industry ?? "");
  const [projectType, setProjectType] = useState(record?.projectType ?? "");
  const [summary, setSummary] = useState(record?.summary ?? "");
  const [challenge, setChallenge] = useState(record?.challenge ?? "");
  const [approach, setApproach] = useState<string[]>(
    Array.isArray(record?.approach) ? (record.approach as string[]) : [],
  );
  const [outcome, setOutcome] = useState(record?.outcome ?? "");
  const [clientObjective, setClientObjective] = useState(record?.clientObjective ?? "");
  const [metrics, setMetrics] = useState<Metric[]>(
    Array.isArray(record?.metrics) ? (record.metrics as Metric[]) : [],
  );
  const [technologies, setTechnologies] = useState(record?.technologies.join(", ") ?? "");
  const [servicesUsed, setServicesUsed] = useState(record?.servicesUsed.join(", ") ?? "");
  const [timeline, setTimeline] = useState(record?.timeline ?? "");
  const [year, setYear] = useState(record?.year ?? String(new Date().getFullYear()));
  const [accent, setAccent] = useState(record?.accent ?? "#6c47ff");
  const [quote, setQuote] = useState(record?.testimonialQuote ?? "");
  const [quoteName, setQuoteName] = useState(record?.testimonialName ?? "");
  const [quoteRole, setQuoteRole] = useState(record?.testimonialRole ?? "");
  const [hero, setHero] = useState<MediaItem | null>(record?.heroMedia ?? null);
  const [thumbnail, setThumbnail] = useState<MediaItem | null>(record?.thumbnail ?? null);
  const [gallery, setGallery] = useState<MediaItem[]>(record?.gallery ?? []);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [featured, setFeatured] = useState(record?.featured ?? false);
  const [seoTitle, setSeoTitle] = useState(record?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(record?.seoDescription ?? "");
  const [noIndex, setNoIndex] = useState(record?.noIndex ?? false);

  const [status, setStatus] = useState(record?.status ?? "DRAFT");
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const slug = slugOverride ?? slugify(`${clientName} ${projectName}`.trim());

  const payload = useMemo(
    () => ({
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      slug: slug.trim() || undefined,
      industry: industry.trim(),
      projectType: projectType.trim(),
      summary: summary.trim(),
      challenge: challenge.trim(),
      approach: approach.map((a) => a.trim()).filter(Boolean),
      outcome: outcome.trim(),
      clientObjective: clientObjective.trim(),
      metrics: metrics.filter((m) => m.value.trim() && m.label.trim()),
      technologies: technologies.split(",").map((t) => t.trim()).filter(Boolean),
      servicesUsed: servicesUsed.split(",").map((t) => t.trim()).filter(Boolean),
      timeline: timeline.trim(),
      year: year.trim(),
      accent: accent.trim(),
      testimonialQuote: quote.trim(),
      testimonialName: quoteName.trim(),
      testimonialRole: quoteRole.trim(),
      heroMediaId: hero?.id ?? null,
      thumbnailId: thumbnail?.id ?? null,
      galleryIds: gallery.map((g) => g.id),
      featured,
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      noIndex,
    }),
    [
      projectName, clientName, slug, industry, projectType, summary, challenge, approach,
      outcome, clientObjective, metrics, technologies, servicesUsed, timeline, year, accent,
      quote, quoteName, quoteRole, hero, thumbnail, gallery, featured, seoTitle, seoDescription, noIndex,
    ],
  );

  const save = useCallback(
    async (nextStatus: "DRAFT" | "PUBLISHED") => {
      setSaving(nextStatus === "PUBLISHED" ? "publish" : "draft");
      setError(null);
      setFieldErrors({});
      try {
        const body = { ...payload, status: nextStatus };
        const saved = isNew
          ? await api.post<CaseStudyRecord>("/api/admin/case-studies", body)
          : await api.patch<CaseStudyRecord>(`/api/admin/case-studies/${record.id}`, body);

        setStatus(saved.status);
        toast(nextStatus === "PUBLISHED" ? "Published — it is live now." : "Draft saved.", "success");
        if (isNew) router.replace(`/admin/case-studies/${saved.id}`);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError) {
          setFieldErrors(err.fields ?? {});
          setError(err.message);
        } else {
          setError("Could not save. Check your connection and try again.");
        }
        toast("Nothing was saved.", "error");
      } finally {
        setSaving(null);
      }
    },
    [payload, isNew, record, router, toast],
  );

  return (
    <>
      <PageHeader
        title={isNew ? "New case study" : projectName || "Edit case study"}
        description={
          isNew ? "Nothing is public until you publish." : `Last saved as ${status.toLowerCase()}.`
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            {status === "PUBLISHED" && !isNew && (
              <Button
                icon={<Eye className="size-4" />}
                onClick={() => window.open(`/case-studies/${slug}`, "_blank")}
              >
                View
              </Button>
            )}
            <Button icon={<Save className="size-4" />} loading={saving === "draft"} onClick={() => save("DRAFT")}>
              Save draft
            </Button>
            <Button
              variant="primary"
              icon={<Send className="size-4" />}
              loading={saving === "publish"}
              onClick={() => save("PUBLISHED")}
            >
              {status === "PUBLISHED" ? "Update" : "Publish"}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="The basics" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Client" htmlFor="clientName" required error={fieldErrors.clientName}>
                <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Himalayan Café" />
              </Field>
              <Field label="Project name" htmlFor="projectName" required error={fieldErrors.projectName}>
                <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="From one location to five" />
              </Field>
              <Field label="Industry" htmlFor="industry">
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Hospitality" />
              </Field>
              <Field label="Project type" htmlFor="projectType">
                <Input id="projectType" value={projectType} onChange={(e) => setProjectType(e.target.value)} placeholder="Web development" />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Slug"
                  htmlFor="slug"
                  error={fieldErrors.slug}
                  hint={
                    status === "PUBLISHED"
                      ? "This is a live URL. Changing it creates a redirect from the old one."
                      : `The page will live at /case-studies/${slug || "…"}`
                  }
                >
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlugOverride(e.target.value)}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Summary" htmlFor="summary" hint="One or two sentences, shown under the title.">
                  <Textarea id="summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="The story" description="What was wrong, what you did, what happened." />
            <div className="space-y-4 p-4">
              <Field label="Client objective" htmlFor="objective">
                <Textarea id="objective" rows={2} value={clientObjective} onChange={(e) => setClientObjective(e.target.value)} />
              </Field>
              <Field label="The problem" htmlFor="challenge">
                <Textarea id="challenge" rows={4} value={challenge} onChange={(e) => setChallenge(e.target.value)} />
              </Field>
              <Field label="What we did" hint="One step per line. These render as a numbered list.">
                <StringList items={approach} onChange={setApproach} placeholder="Built a Next.js storefront with…" addLabel="Add a step" />
              </Field>
              <Field label="The result" htmlFor="outcome">
                <Textarea id="outcome" rows={4} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Results" description="Numbers the client's own analytics can back up." />
            <div className="space-y-2 p-4">
              {metrics.map((metric, i) => (
                <div key={i} className="flex min-w-0 gap-2">
                  <Input
                    value={metric.value}
                    placeholder="+240%"
                    aria-label={`Metric ${i + 1} value`}
                    className="w-28 shrink-0"
                    onChange={(e) => {
                      const next = [...metrics];
                      next[i] = { ...next[i], value: e.target.value };
                      setMetrics(next);
                    }}
                  />
                  <Input
                    value={metric.label}
                    placeholder="Direct online orders"
                    aria-label={`Metric ${i + 1} label`}
                    onChange={(e) => {
                      const next = [...metrics];
                      next[i] = { ...next[i], label: e.target.value };
                      setMetrics(next);
                    }}
                  />
                  <button
                    type="button"
                    aria-label={`Remove metric ${i + 1}`}
                    onClick={() => setMetrics(metrics.filter((_, index) => index !== i))}
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                icon={<Plus className="size-4" />}
                onClick={() => setMetrics([...metrics, { value: "", label: "" }])}
              >
                Add a metric
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Testimonial" description="Optional." />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Quote" htmlFor="quote">
                  <Textarea id="quote" rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} />
                </Field>
              </div>
              <Field label="Name" htmlFor="quoteName">
                <Input id="quoteName" value={quoteName} onChange={(e) => setQuoteName(e.target.value)} />
              </Field>
              <Field label="Role" htmlFor="quoteRole">
                <Input id="quoteRole" value={quoteRole} onChange={(e) => setQuoteRole(e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Search & sharing" />
            <div className="space-y-4 p-4">
              <Field label="SEO title" htmlFor="cs-seoTitle">
                <Input id="cs-seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </Field>
              <Field label="Meta description" htmlFor="cs-seoDescription">
                <Textarea id="cs-seoDescription" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
              </Field>
              <Toggle checked={noIndex} onChange={setNoIndex} label="Hide from search engines" />
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="Hero image" />
            <div className="p-4">
              <ImageField value={hero} onChange={setHero} folder="case-studies" label="hero image" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Card thumbnail" />
            <div className="p-4">
              <ImageField value={thumbnail} onChange={setThumbnail} folder="case-studies" label="thumbnail" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Gallery"
              action={
                <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setGalleryOpen(true)}>
                  Add
                </Button>
              }
            />
            <div className="p-4">
              {gallery.length === 0 ? (
                <p className="text-[0.8125rem] text-muted">No gallery images yet.</p>
              ) : (
                <ul className="grid grid-cols-3 gap-2">
                  {gallery.map((item) => (
                    <li key={item.id} className="group relative overflow-hidden rounded-lg border border-line">
                      <span className="relative block aspect-square bg-canvas">
                        <MediaThumb item={item} />
                      </span>
                      <button
                        type="button"
                        aria-label="Remove from gallery"
                        onClick={() => setGallery(gallery.filter((g) => g.id !== item.id))}
                        className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Details" />
            <div className="space-y-4 p-4">
              <Field label="Technologies" htmlFor="tech" hint="Comma separated.">
                <Input id="tech" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Next.js, PostgreSQL" />
              </Field>
              <Field label="Services provided" htmlFor="services" hint="Comma separated.">
                <Input id="services" value={servicesUsed} onChange={(e) => setServicesUsed(e.target.value)} placeholder="Web Development, SEO" />
              </Field>
              <Field label="Timeline" htmlFor="timeline">
                <Input id="timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="7 weeks build, 12 months growth" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year" htmlFor="year">
                  <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} />
                </Field>
                <Field label="Accent" htmlFor="accent" error={fieldErrors.accent}>
                  <div className="flex min-w-0 gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-f]{6}$/i.test(accent) ? accent : "#6c47ff"}
                      onChange={(e) => setAccent(e.target.value)}
                      aria-label="Accent colour"
                      className="size-9 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
                    />
                    <Input id="accent" value={accent} onChange={(e) => setAccent(e.target.value)} />
                  </div>
                </Field>
              </div>
              <Toggle checked={featured} onChange={setFeatured} label="Feature this" />
            </div>
          </Panel>
        </div>
      </div>

      <MediaPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        accept="IMAGE"
        folder="case-studies"
        onSelect={(item) => {
          setGallery((prev) => (prev.some((g) => g.id === item.id) ? prev : [...prev, item]));
          setGalleryOpen(false);
        }}
      />
    </>
  );
}
