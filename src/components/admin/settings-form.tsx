"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { PageHeader } from "@/components/admin/shell";
import { Banner, Button, Field, Input, Panel, PanelHeader, Textarea, Toggle } from "@/components/admin/ui";
import type { SiteSettings } from "@/server/schemas/settings";

/**
 * Site settings.
 *
 * These override the values committed in `config/site.ts` rather than replacing
 * them, so an empty database still renders the site correctly and a wrong entry
 * here can be cleared rather than needing a deploy to fix.
 */
export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.patch("/api/admin/settings", values);
      toast("Settings saved.", "success");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {});
        setError(err.message);
      } else {
        setError("Could not save the settings.");
      }
      toast("Nothing was saved.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Values the website reads at render time — no deploy needed."
        action={
          <Button variant="primary" icon={<Save className="size-4" />} loading={saving} onClick={save}>
            Save changes
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="General" />
          <div className="space-y-4 p-4">
            <Field label="Website name" htmlFor="siteName" error={fieldErrors.siteName}>
              <Input id="siteName" value={values.siteName} onChange={(e) => set("siteName", e.target.value)} />
            </Field>
            <Field label="Contact email" htmlFor="contactEmail" error={fieldErrors.contactEmail}>
              <Input id="contactEmail" type="email" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="contactPhone" error={fieldErrors.contactPhone}>
              <Input id="contactPhone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
            <Field label="Address" htmlFor="address" error={fieldErrors.address}>
              <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Contact & enquiries" description="Where website enquiries go." />
          <div className="space-y-4 p-4">
            <Field
              label="WhatsApp number"
              htmlFor="whatsappNumber"
              error={fieldErrors.whatsappNumber}
              hint="Digits only, with country code and no plus. Used by the floating chat widget."
            >
              <Input
                id="whatsappNumber"
                value={values.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="9779747745188"
              />
            </Field>
            <Field
              label="Notification recipients"
              htmlFor="notificationRecipients"
              error={fieldErrors.notificationRecipients}
              hint="Comma separated. Every enquiry email goes to these addresses."
            >
              <Textarea
                id="notificationRecipients"
                rows={2}
                value={values.notificationRecipients}
                onChange={(e) => set("notificationRecipients", e.target.value)}
              />
            </Field>
            <Toggle
              checked={values.sendAcknowledgement}
              onChange={(v) => set("sendAcknowledgement", v)}
              label="Send an acknowledgement to the visitor"
              hint="A branded 'we have your message' email, sent immediately."
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="SEO defaults" description="Used where a page sets nothing of its own." />
          <div className="space-y-4 p-4">
            <Field label="Default title" htmlFor="defaultSeoTitle" error={fieldErrors.defaultSeoTitle}>
              <Input id="defaultSeoTitle" value={values.defaultSeoTitle} onChange={(e) => set("defaultSeoTitle", e.target.value)} />
            </Field>
            <Field label="Default description" htmlFor="defaultSeoDescription" error={fieldErrors.defaultSeoDescription}>
              <Textarea id="defaultSeoDescription" rows={3} value={values.defaultSeoDescription} onChange={(e) => set("defaultSeoDescription", e.target.value)} />
            </Field>
            <Field label="Default social image URL" htmlFor="defaultOgImageUrl" error={fieldErrors.defaultOgImageUrl}>
              <Input id="defaultOgImageUrl" value={values.defaultOgImageUrl} onChange={(e) => set("defaultOgImageUrl", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Social profiles" description="Shown in the footer and in structured data." />
          <div className="space-y-4 p-4">
            {(["linkedin", "instagram", "facebook", "youtube", "x"] as const).map((key) => (
              <Field
                key={key}
                label={key === "x" ? "X (Twitter)" : key[0].toUpperCase() + key.slice(1)}
                htmlFor={key}
                error={fieldErrors[key]}
              >
                <Input id={key} value={values[key]} onChange={(e) => set(key, e.target.value)} placeholder="https://…" />
              </Field>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
