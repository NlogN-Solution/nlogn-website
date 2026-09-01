"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Send } from "lucide-react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
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

/**
 * The blog and insight editor.
 *
 * Draft and Publish are separate actions rather than a status dropdown plus a
 * save button, because "did that go live?" should never be a question. The slug
 * follows the title only until the piece is published — after that it is left
 * alone, and changing it deliberately leaves a redirect behind.
 */

export type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  status: string;
  featured: boolean;
  authorName: string | null;
  authorRole: string | null;
  categoryId: string | null;
  coverMedia: MediaItem | null;
  ogImage: MediaItem | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  publishedAt: string | null;
  tags: { id: string; name: string }[];
};

type Taxonomy = { categories: { id: string; name: string }[] };

export function ArticleEditor({
  kind,
  record,
}: {
  kind: "blogs" | "insights";
  record?: ArticleRecord;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !record;
  const publicPath = kind === "blogs" ? "/blog" : "/insights";

  const [title, setTitle] = useState(record?.title ?? "");
  // The slug is derived from the title until someone edits it, at which point
  // the override takes over. Derived during render rather than synced by an
  // effect, so there is never a frame where the two disagree.
  const [slugOverride, setSlugOverride] = useState<string | null>(record?.slug ?? null);
  const [excerpt, setExcerpt] = useState(record?.excerpt ?? "");
  const [content, setContent] = useState<unknown>(record?.content ?? null);
  const [featured, setFeatured] = useState(record?.featured ?? false);
  const [authorName, setAuthorName] = useState(record?.authorName ?? "");
  const [authorRole, setAuthorRole] = useState(record?.authorRole ?? "");
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
      excerpt: excerpt.trim(),
      content,
      featured,
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
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
      title, slug, excerpt, content, featured, authorName, authorRole,
      categoryId, tagText, cover, ogImage, seoTitle, seoDescription, canonicalUrl, noIndex,
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
          ? await api.post<ArticleRecord>(`/api/admin/${kind}`, body)
          : await api.patch<ArticleRecord>(`/api/admin/${kind}/${record.id}`, body);

        setStatus(saved.status);
        toast(
          nextStatus === "PUBLISHED" ? "Published — it is live now." : "Draft saved.",
          "success",
        );

        if (isNew) router.replace(`/admin/${kind}/${saved.id}`);
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
    [payload, isNew, kind, record, router, toast],
  );

  const singular = kind === "blogs" ? "blog" : "insight";

  return (
    <>
      <PageHeader
        title={isNew ? `New ${singular}` : title || `Edit ${singular}`}
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
                onClick={() => window.open(`${publicPath}/${slug}`, "_blank")}
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
                  placeholder="How AI is changing small-business operations"
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="slug"
                error={fieldErrors.slug}
                hint={
                  status === "PUBLISHED"
                    ? "This is a live URL. Changing it creates a redirect from the old one."
                    : `The page will live at ${publicPath}/${slug || "…"}`
                }
              >
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlugOverride(e.target.value)}
                  placeholder="how-ai-is-changing-operations"
                />
              </Field>

              <Field
                label="Excerpt"
                htmlFor="excerpt"
                error={fieldErrors.excerpt}
                hint="Shown on cards and in search results. Left empty, the opening lines are used."
              >
                <Textarea
                  id="excerpt"
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Content" />
            <div className="p-4">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Search & sharing"
              description="Left blank, the title and excerpt are used."
            />
            <div className="space-y-4 p-4">
              <Field label="SEO title" htmlFor="seoTitle" error={fieldErrors.seoTitle}>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={200}
                />
              </Field>
              <Field
                label="Meta description"
                htmlFor="seoDescription"
                error={fieldErrors.seoDescription}
                hint={`${seoDescription.length}/160 characters is the usual display limit.`}
              >
                <Textarea
                  id="seoDescription"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
              </Field>
              <Field
                label="Canonical URL"
                htmlFor="canonicalUrl"
                error={fieldErrors.canonicalUrl}
                hint="Only needed if this was published elsewhere first."
              >
                <Input
                  id="canonicalUrl"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Social image">
                <ImageField
                  value={ogImage}
                  onChange={setOgImage}
                  folder={kind === "blogs" ? "blogs" : "insights"}
                  label="social image"
                />
              </Field>
              <Toggle
                checked={noIndex}
                onChange={setNoIndex}
                label="Hide from search engines"
                hint="Adds a noindex tag. The page stays reachable by link."
              />
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="Cover image" />
            <div className="p-4">
              <ImageField
                value={cover}
                onChange={setCover}
                folder={kind === "blogs" ? "blogs" : "insights"}
                label="cover image"
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Organisation" />
            <div className="space-y-4 p-4">
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Tags"
                htmlFor="tags"
                hint="Comma separated. New tags are created automatically."
              >
                <Input
                  id="tags"
                  value={tagText}
                  onChange={(e) => setTagText(e.target.value)}
                  placeholder="nextjs, performance"
                />
              </Field>

              <Toggle
                checked={featured}
                onChange={setFeatured}
                label="Feature this"
                hint="Featured items lead the listing page."
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Byline" />
            <div className="space-y-4 p-4">
              <Field label="Author name" htmlFor="authorName">
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Kabin Shrestha"
                />
              </Field>
              <Field label="Author role" htmlFor="authorRole">
                <Input
                  id="authorRole"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="Founder"
                />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
