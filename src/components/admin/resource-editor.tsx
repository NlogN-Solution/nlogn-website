"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Download, Eye, Link2, Plus, Save, Send, Users } from "lucide-react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { RichEditor } from "@/components/admin/rich-editor";
import { ImageField, type MediaItem } from "@/components/admin/media-picker";
import { PageHeader } from "@/components/admin/shell";
import {
  Banner,
  Button,
  Field,
  Input,
  Panel,
  PanelHeader,
  Select,
  StatusBadge,
  Textarea,
  Toggle,
} from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import {
  RESOURCE_GATES,
  RESOURCE_GATE_HINTS,
  RESOURCE_GATE_LABELS,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_MEDIA_FOLDER,
  type ResourceGateName,
} from "@/config/resources";

/**
 * The resource editor.
 *
 * Two things make this different from the article editor it otherwise mirrors.
 * The **gate** is a commercial decision with a wrong answer, so it carries its
 * reasoning inline rather than sitting in a bare dropdown. And the
 * **distribution panel** exists because a resource that nobody can link to from
 * a reel is only half-built — the short code is part of publishing, not an
 * afterthought.
 */

export type ShortLinkRecord = {
  id: string;
  code: string;
  platform: string | null;
  note: string | null;
  clicks: number;
  lastClickAt: string | null;
};

export type ResourceRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  descriptionHtml: string | null;
  type: string;
  gate: string;
  status: string;
  featured: boolean;
  includes: string[];
  licence: string | null;
  version: string | null;
  fileLabel: string | null;
  externalUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  categoryId: string | null;
  coverMedia: MediaItem | null;
  fileMedia: MediaItem | null;
  ogImage: MediaItem | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  unlocks: number;
  downloads: number;
  tags: { id: string; name: string }[];
  links: ShortLinkRecord[];
};

type Taxonomy = { categories: { id: string; name: string }[] };

export function ResourceEditor({ record }: { record?: ResourceRecord }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !record;

  const [title, setTitle] = useState(record?.title ?? "");
  const [slugOverride, setSlugOverride] = useState<string | null>(record?.slug ?? null);
  const [summary, setSummary] = useState(record?.summary ?? "");
  const [description, setDescription] = useState(record?.descriptionHtml ?? "");
  const [type, setType] = useState(record?.type ?? "TEMPLATE");
  const [gate, setGate] = useState(record?.gate ?? "EMAIL");
  const [featured, setFeatured] = useState(record?.featured ?? false);
  // One per line in the box, an array on the wire. A list is what this is, and
  // a line break is how anybody types one without thinking about it.
  const [includes, setIncludes] = useState(record?.includes.join("\n") ?? "");
  const [licence, setLicence] = useState(record?.licence ?? "");
  const [version, setVersion] = useState(record?.version ?? "");
  const [fileLabel, setFileLabel] = useState(record?.fileLabel ?? "");
  const [repoUrl, setRepoUrl] = useState(record?.repoUrl ?? "");
  const [demoUrl, setDemoUrl] = useState(record?.demoUrl ?? "");
  const [categoryId, setCategoryId] = useState(record?.categoryId ?? "");
  const [tagText, setTagText] = useState(record?.tags.map((t) => t.name).join(", ") ?? "");
  const [cover, setCover] = useState<MediaItem | null>(record?.coverMedia ?? null);
  const [ogImage, setOgImage] = useState<MediaItem | null>(record?.ogImage ?? null);
  const [seoTitle, setSeoTitle] = useState(record?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(record?.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(record?.canonicalUrl ?? "");
  const [noIndex, setNoIndex] = useState(record?.noIndex ?? false);

  const [status, setStatus] = useState(record?.status ?? "DRAFT");
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Taxonomy["categories"]>([]);

  useEffect(() => {
    api
      .get<Taxonomy>("/api/admin/taxonomy")
      .then((t) => setCategories(t.categories))
      .catch(() => undefined);
  }, []);

  const slug = slugOverride ?? slugify(title);

  const payload = useMemo(
    () => ({
      title: title.trim(),
      slug: slug.trim() || undefined,
      summary: summary.trim(),
      descriptionHtml: description,
      type,
      gate,
      featured,
      includes: includes
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      licence: licence.trim(),
      version: version.trim(),
      fileLabel: fileLabel.trim(),
      repoUrl: repoUrl.trim(),
      demoUrl: demoUrl.trim(),
      categoryId: categoryId || null,
      tagNames: tagText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coverMediaId: cover?.id ?? null,
      ogImageId: ogImage?.id ?? null,
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      canonicalUrl: canonicalUrl.trim(),
      noIndex,
    }),
    [
      title, slug, summary, description, type, gate, featured, includes, licence,
      version, fileLabel, repoUrl, demoUrl, categoryId, tagText,
      cover, ogImage, seoTitle, seoDescription, canonicalUrl, noIndex,
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
          ? await api.post<ResourceRecord>("/api/admin/resources", body)
          : await api.patch<ResourceRecord>(`/api/admin/resources/${record.id}`, body);

        setStatus(saved.status);
        toast(
          nextStatus === "PUBLISHED" ? "Published — it is live now." : "Draft saved.",
          "success",
        );

        if (isNew) router.replace(`/admin/resources/${saved.id}`);
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
        title={isNew ? "New resource" : title || "Edit resource"}
        description={
          isNew
            ? "Save a draft at any point — nothing is public until you publish."
            : `Last saved as ${status.toLowerCase()}.`
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            {status === "PUBLISHED" && !isNew && (
              <Button
                icon={<Eye className="size-4" />}
                onClick={() => window.open(`/resources/${slug}`, "_blank")}
              >
                View
              </Button>
            )}
            <Button
              icon={<Save className="size-4" />}
              loading={saving === "draft"}
              onClick={() => save("DRAFT")}
            >
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
          <Panel className="p-4">
            <div className="space-y-4">
              <Field label="Title" htmlFor="title" required error={fieldErrors.title}>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Next.js 16 SaaS starter"
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="slug"
                error={fieldErrors.slug}
                hint={
                  status === "PUBLISHED"
                    ? "This is a live URL. Anything already printed in a video caption points here."
                    : `The page will live at /resources/${slug || "…"}`
                }
              >
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlugOverride(e.target.value)}
                  placeholder="nextjs-16-saas-starter"
                />
              </Field>

              <Field
                label="Summary"
                htmlFor="summary"
                error={fieldErrors.summary}
                hint="One line, shown on the card and in search results."
              >
                <Textarea
                  id="summary"
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </Field>

              <Field
                label="What's inside"
                htmlFor="includes"
                error={fieldErrors.includes}
                hint="One item per line. Listed above the gate — showing the contents is what makes an email feel like a fair trade."
              >
                <Textarea
                  id="includes"
                  rows={5}
                  value={includes}
                  onChange={(e) => setIncludes(e.target.value)}
                  placeholder={"Auth, billing and a dashboard shell\nPostgres schema with migrations\nCI that actually passes"}
                />
              </Field>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Description"
              description="The long version, for anyone still deciding. Optional — the summary and the contents list carry most of the weight."
            />
            <RichEditor value={description} onChange={setDescription} />
          </Panel>

          <Panel>
            <PanelHeader
              title="What they get"
              description="The repository, and optionally somewhere to see it running. Nothing is hosted here any more — the library hands over source code, so the destination is always the repo."
            />
            <div className="space-y-4 p-4">
              <Field
                label="Repository URL"
                htmlFor="repoUrl"
                required
                error={fieldErrors.repoUrl}
                hint="The public repo. This is the destination: the button reads “Download source code” and goes straight to GitHub. Needed before this can be published."
              >
                <Input
                  id="repoUrl"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/nlogn/…"
                />
              </Field>

              <Field
                label="Live demo URL"
                htmlFor="demoUrl"
                error={fieldErrors.demoUrl}
                hint="Optional. Shown as a secondary link — seeing it run converts better than reading about it."
              >
                <Input
                  id="demoUrl"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Panel>

          {!isNew && <Distribution record={record} slug={slug} />}

          <Panel>
            <PanelHeader title="Search appearance" description="Left empty, the title and summary are used." />
            <div className="space-y-4 p-4">
              <Field label="SEO title" htmlFor="seoTitle" error={fieldErrors.seoTitle}>
                <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </Field>
              <Field label="Meta description" htmlFor="seoDescription" error={fieldErrors.seoDescription}>
                <Textarea
                  id="seoDescription"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
              </Field>
              <Field label="Canonical URL" htmlFor="canonicalUrl" error={fieldErrors.canonicalUrl}>
                <Input
                  id="canonicalUrl"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                />
              </Field>
              <Field label="Social image">
                <ImageField
                  value={ogImage}
                  onChange={setOgImage}
                  folder={RESOURCE_MEDIA_FOLDER}
                  label="social image"
                />
              </Field>
              <Toggle
                checked={noIndex}
                onChange={setNoIndex}
                label="Hide from search engines"
                hint="The page still works and can still be linked from a reel."
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Access" />
            <div className="space-y-4 p-4">
              <Field label="Gate" htmlFor="gate" error={fieldErrors.gate}>
                <Select id="gate" value={gate} onChange={(e) => setGate(e.target.value)}>
                  {RESOURCE_GATES.map((name) => (
                    <option key={name} value={name}>
                      {RESOURCE_GATE_LABELS[name]}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* The reasoning, not just the label. Choosing EMAIL for a public
                  repo is the expensive mistake here and it is not visible from
                  the dropdown alone. */}
              <p className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-[0.75rem] leading-relaxed text-muted">
                {RESOURCE_GATE_HINTS[gate as ResourceGateName]}
              </p>

              <Field label="Type" htmlFor="type" error={fieldErrors.type}>
                <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                  {RESOURCE_TYPES.map((name) => (
                    <option key={name} value={name}>
                      {RESOURCE_TYPE_LABELS[name]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Button label"
                htmlFor="fileLabel"
                error={fieldErrors.fileLabel}
                hint='Overrides the button text. Left empty it reads "Download source code", which is usually the right thing to say — fill this in only when you can beat it.'
              >
                <Input
                  id="fileLabel"
                  value={fileLabel}
                  onChange={(e) => setFileLabel(e.target.value)}
                  placeholder="ZIP · 4.2 MB"
                />
              </Field>

              <Field label="Licence" htmlFor="licence" error={fieldErrors.licence}>
                <Input
                  id="licence"
                  value={licence}
                  onChange={(e) => setLicence(e.target.value)}
                  placeholder="MIT"
                />
              </Field>

              <Field label="Version" htmlFor="version" error={fieldErrors.version}>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v2.1"
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Presentation" />
            <div className="space-y-4 p-4">
              <Toggle
                checked={featured}
                onChange={setFeatured}
                label="Feature it"
                hint="Pinned to the top of the library."
              />
              <Field label="Cover image">
                <ImageField value={cover} onChange={setCover} folder={RESOURCE_MEDIA_FOLDER} />
              </Field>
              <Field label="Category" htmlFor="categoryId">
                <Select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tags" htmlFor="tags" hint="Comma separated.">
                <Input
                  id="tags"
                  value={tagText}
                  onChange={(e) => setTagText(e.target.value)}
                  placeholder="nextjs, starter, auth"
                />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

/**
 * Short links and the funnel they feed.
 *
 * One code per video, because "which reel converted" cannot be answered any
 * other way — Instagram's in-app browser sends no referer worth having. The
 * three numbers are deliberately next to each other: clicks against unlocks is
 * how good the page is, unlocks against downloads is whether the email arrived.
 */
function Distribution({ record, slug }: { record: ResourceRecord; slug: string }) {
  const toast = useToast();
  const [links, setLinks] = useState<ShortLinkRecord[]>(record.links);
  const [code, setCode] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  const origin = typeof window === "undefined" ? "" : window.location.origin;

  async function create() {
    setCreating(true);
    try {
      const link = await api.post<ShortLinkRecord>(`/api/admin/resources/${record.id}/links`, {
        code: code.trim() || undefined,
        platform,
        note: note.trim(),
      });
      setLinks((current) => [link, ...current]);
      setCode("");
      setNote("");
      toast(`/r/${link.code} is live.`, "success");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not create that link.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Copied.", "success");
    } catch {
      // Clipboard access is denied in some contexts; the URL is on screen and
      // selectable either way, so this is not worth an error toast.
      toast("Select and copy it manually.", "error");
    }
  }

  const clicks = links.reduce((total, link) => total + link.clicks, 0);

  return (
    <Panel>
      <PanelHeader
        title="Distribution"
        description="One short link per video, so the funnel can be read per reel rather than in aggregate."
      />

      <div className="p-4">
        <dl className="grid grid-cols-3 gap-2">
          <Stat icon={<Link2 className="size-4" />} label="Clicks" value={clicks} />
          <Stat icon={<Users className="size-4" />} label="Unlocks" value={record.unlocks} />
          <Stat icon={<Download className="size-4" />} label="Downloads" value={record.downloads} />
        </dl>

        <div className="mt-4 space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-surface px-3 py-2.5"
            >
              <code className="text-[0.8125rem] font-medium text-ink">/r/{link.code}</code>
              <span className="text-[0.75rem] text-muted">
                {link.platform ?? "—"}
                {link.note ? ` · ${link.note}` : ""}
              </span>
              <span className="ml-auto text-[0.75rem] text-muted">
                {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon={<Copy className="size-3.5" />}
                onClick={() => copy(`${origin}/r/${link.code}`)}
              >
                Copy
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[7rem_9rem_minmax(0,1fr)_auto]">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="code (auto)"
            aria-label="Short code"
          />
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="newsletter">Newsletter</option>
            <option value="other">Other</option>
          </Select>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="reel: 5 VS Code tricks"
            aria-label="Note"
          />
          <Button icon={<Plus className="size-4" />} loading={creating} onClick={create}>
            Add
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <a
            href={`/api/admin/resources/leads?resourceId=${record.id}&format=csv`}
            className="text-[0.8125rem] font-medium text-violet transition-colors hover:text-ink"
          >
            Export the {record.unlocks} {record.unlocks === 1 ? "lead" : "leads"} as CSV
          </a>
          <Link
            href="/admin/resources/insights"
            className="text-[0.8125rem] font-medium text-violet transition-colors hover:text-ink"
          >
            See the whole funnel
          </Link>
          <span className="text-[0.75rem] text-muted">· /resources/{slug}</span>
        </div>
      </div>
    </Panel>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[0.75rem] text-muted">
        <span className="text-violet">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-[1.125rem] font-bold tracking-[-0.02em] text-ink">
        {value.toLocaleString("en-GB")}
      </dd>
    </div>
  );
}
