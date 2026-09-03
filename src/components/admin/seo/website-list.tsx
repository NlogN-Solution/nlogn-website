"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { Button, EmptyState, Field, Input, Modal, Panel, PanelHeader } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { api, ApiError } from "@/components/admin/api";

/**
 * The list of websites this dashboard reports on.
 *
 * Adding one only needs a name and a domain — every provider is connected
 * afterwards, from that website's own integrations page, so nobody is asked for
 * four credentials before seeing anything work.
 */

export type WebsiteRow = {
  id: string;
  name: string;
  domain: string;
  gscSiteUrl: string | null;
  ga4PropertyId: string | null;
  isActive: boolean;
};

export function WebsiteList({
  websites,
  canWrite,
}: {
  websites: WebsiteRow[];
  canWrite: boolean;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader
        title="SEO & Performance"
        description="Websites this dashboard reports on."
        action={
          canWrite && (
            <Button variant="primary" onClick={() => setAdding(true)} icon={<Plus className="size-4" aria-hidden />}>
              Add a website
            </Button>
          )
        }
      />

      <Panel>
        <PanelHeader title="Websites" description={`${websites.length} tracked`} />

        {websites.length === 0 ? (
          <EmptyState
            title="No websites yet"
            body="Add a website to start reporting on its search performance, traffic and technical health."
            action={
              canWrite && (
                <Button variant="primary" onClick={() => setAdding(true)}>
                  Add the first website
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {websites.map((website) => (
              <li key={website.id}>
                <Link
                  href={`/admin/seo/${website.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-wash text-violet">
                    <Globe className="size-4" aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem] font-medium text-ink">
                      {website.name}
                    </span>
                    <span className="block truncate text-[0.75rem] text-muted">
                      {website.domain}
                    </span>
                  </span>

                  <span className="hidden shrink-0 gap-1.5 sm:flex">
                    <Chip on={Boolean(website.gscSiteUrl)} label="Search Console" />
                    <Chip on={Boolean(website.ga4PropertyId)} label="Analytics" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <AddWebsiteDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function Chip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium ${
        on ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line bg-canvas text-muted"
      }`}
    >
      {label}
    </span>
  );
}

function AddWebsiteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const website = await api.post<{ id: string }>("/api/admin/websites", { name, domain });
      toast("Website added. Connect Google next.", "success");
      onClose();
      setName("");
      setDomain("");
      router.push(`/admin/seo/${website.id}/integrations`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields ?? {});
        if (!error.fields) toast(error.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a website"
      description="Connect its data sources on the next screen."
    >
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <Field label="Name" required htmlFor="website-name" hint="How it appears in this dashboard.">
          <Input
            id="website-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="nlogn"
            required
            autoFocus
          />
        </Field>

        <Field
          label="Domain"
          required
          htmlFor="website-domain"
          error={errors.domain}
          hint="Just the domain — nlogn.com. Pasting a full address is fine too."
        >
          <Input
            id="website-domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="nlogn.com"
            required
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Add website
          </Button>
        </div>
      </form>
    </Modal>
  );
}
