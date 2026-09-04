"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Gauge,
  Link2,
  RefreshCw,
  ScanSearch,
  Search,
  Unplug,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { Banner, Button, ConfirmDialog, Panel, Select } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { api, ApiError } from "@/components/admin/api";
import { useEndpoint } from "@/components/admin/seo/hooks";
import { runSync } from "@/components/admin/seo/dashboard";
import { relativeTime } from "@/lib/metrics";
import { cn } from "@/lib/utils";

/**
 * Integration settings.
 *
 * Two different failures are reported separately because they have different
 * fixes: an environment variable missing on the server is a deploy change, and
 * a provider not connected for this website is a button click. Collapsing them
 * into one "not working" would send somebody looking in the wrong place.
 *
 * Nothing here ever asks for a credential. Google is connected through its own
 * consent screen; Ahrefs and PageSpeed keys live in the server environment.
 */

type Connection = {
  provider: "GOOGLE_SEARCH_CONSOLE" | "GOOGLE_ANALYTICS" | "PAGESPEED" | "AHREFS";
  status: "DISCONNECTED" | "CONNECTED" | "NEEDS_REAUTH" | "ERROR" | "UNAVAILABLE";
  accountLabel: string | null;
  scopes: string[];
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

type Response = {
  connections: Connection[];
  website: {
    id: string;
    name: string;
    domain: string;
    ga4PropertyId: string | null;
    gscSiteUrl: string | null;
  };
  server: {
    googleOAuth: boolean;
    encryption: boolean;
    pageSpeed: boolean;
    ahrefs: boolean;
    ahrefsNote: string | null;
  };
  crawler: {
    startedAt: string;
    finishedAt: string | null;
    status: string;
    pagesCrawled: number;
  } | null;
};

type Properties = {
  connected: boolean;
  reason?: string;
  searchConsole: { siteUrl: string; permissionLevel: string }[];
  analytics: { propertyId: string; displayName: string; account: string }[];
};

const STATUS_TONE: Record<Connection["status"], string> = {
  CONNECTED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  NEEDS_REAUTH: "border-amber-200 bg-amber-50 text-amber-800",
  ERROR: "border-red-200 bg-red-50 text-red-800",
  UNAVAILABLE: "border-line bg-canvas text-muted",
  DISCONNECTED: "border-line bg-canvas text-muted",
};

const STATUS_LABEL: Record<Connection["status"], string> = {
  CONNECTED: "Connected",
  NEEDS_REAUTH: "Reconnect needed",
  ERROR: "Error",
  UNAVAILABLE: "Not available on this plan",
  DISCONNECTED: "Not connected",
};

export function IntegrationsManager({
  websiteId,
  canConnect,
  callbackStatus,
}: {
  websiteId: string;
  canConnect: boolean;
  callbackStatus?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const { data, loading } = useEndpoint<Response>(
    `/api/admin/websites/${websiteId}/integrations`,
    { v: version },
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const google = data?.connections.find((c) => c.provider === "GOOGLE_SEARCH_CONSOLE");
  const googleConnected = google?.status === "CONNECTED";

  const connect = async () => {
    setBusy("connect");
    try {
      const { url } = await api.get<{ url: string }>(
        `/api/admin/seo/oauth/google/start?websiteId=${websiteId}`,
      );
      // A full navigation, not a router push: this leaves the application for
      // Google's consent screen.
      window.location.href = url;
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not start the connection.", "error");
      setBusy(null);
    }
  };

  const sync = async (provider: string, label: string) => {
    setBusy(provider);
    toast(`Syncing ${label}…`);
    const result = await runSync(websiteId, provider);
    toast(result.message || (result.ok ? "Done." : "That did not work."), result.ok ? "success" : "error");
    setBusy(null);
    reload();
    router.refresh();
  };

  const disconnect = async (provider: string) => {
    setBusy(provider);
    try {
      await api.del(`/api/admin/websites/${websiteId}/integrations/${provider}`);
      toast("Disconnected.", "success");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not disconnect.", "error");
    } finally {
      setBusy(null);
      setDisconnecting(null);
      reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Integrations"
        description={data ? `Data sources for ${data.website.domain}.` : "Data sources."}
        action={
          <Link
            href={`/admin/seo/${websiteId}`}
            className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-canvas"
          >
            Back to the dashboard
          </Link>
        }
      />

      <CallbackBanner status={callbackStatus} />

      {data && !data.server.encryption && (
        <div className="mb-4">
          <Banner tone="error">
            <strong>SEO_TOKEN_ENCRYPTION_KEY is not set.</strong> Connections cannot be stored
            securely until it is, so connecting is disabled. Generate one with{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[0.75rem]">
              openssl rand -base64 32
            </code>{" "}
            and add it to the server environment.
          </Banner>
        </div>
      )}

      {data && data.server.encryption && !data.server.googleOAuth && (
        <div className="mb-4">
          <Banner tone="warning">
            <strong>Google OAuth is not configured.</strong> Set{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[0.75rem]">
              GOOGLE_OAUTH_CLIENT_ID
            </code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[0.75rem]">
              GOOGLE_OAUTH_CLIENT_SECRET
            </code>{" "}
            to connect Search Console and Analytics.
          </Banner>
        </div>
      )}

      {loading && !data ? (
        <Panel className="px-5 py-12 text-center text-[0.8125rem] text-muted">Loading…</Panel>
      ) : !data ? null : (
        <div className="space-y-3">
          <IntegrationCard
            icon={Search}
            title="Google Search Console"
            blurb="Search rankings, clicks, impressions and the keywords people use to find you."
            connection={google}
            disabled={!data.server.googleOAuth || !data.server.encryption}
            canConnect={canConnect}
            busy={busy}
            onConnect={connect}
            onSync={() => sync("google-search-console", "Search Console")}
            onDisconnect={() => setDisconnecting("google-search-console")}
            syncKey="google-search-console"
          >
            {googleConnected && (
              <PropertyPickers websiteId={websiteId} website={data.website} onSaved={reload} />
            )}
          </IntegrationCard>

          <IntegrationCard
            icon={BarChart3}
            title="Google Analytics"
            blurb="Visitors, sessions, engagement and where your traffic comes from. The tracking tag on your website is separate and keeps running either way."
            connection={data.connections.find((c) => c.provider === "GOOGLE_ANALYTICS")}
            disabled={!googleConnected}
            disabledNote="Connect Google Search Console first — one Google sign-in covers both."
            canConnect={canConnect}
            busy={busy}
            onSync={() => sync("google-analytics", "Analytics")}
            syncKey="google-analytics"
          />

          <IntegrationCard
            icon={Gauge}
            title="PageSpeed Insights"
            blurb="Page speed and Core Web Vitals, measured by Google."
            connection={data.connections.find((c) => c.provider === "PAGESPEED")}
            configured={data.server.pageSpeed}
            configuredNote="Add a PAGESPEED_API_KEY to the server environment. Without one, Google throttles these requests heavily."
            canConnect={canConnect}
            busy={busy}
            onSync={() => sync("pagespeed", "PageSpeed")}
            syncKey="pagespeed"
          />

          <IntegrationCard
            icon={Link2}
            title="Ahrefs"
            blurb="Backlinks, referring domains and keyword counts."
            connection={data.connections.find((c) => c.provider === "AHREFS")}
            configured={data.server.ahrefs}
            configuredNote={data.server.ahrefsNote ?? undefined}
            canConnect={canConnect}
            busy={busy}
            onSync={() => sync("ahrefs", "Ahrefs")}
            syncKey="ahrefs"
          />

          <Panel className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-wash text-violet">
                  <ScanSearch className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-semibold text-ink">Technical SEO audit</p>
                  <p className="mt-1 max-w-lg text-[0.8125rem] leading-relaxed text-muted">
                    Visits your pages and checks them for missing titles, broken links, indexing
                    problems and the rest. Respects your robots.txt and paces itself so it never
                    puts load on your site.
                  </p>
                  {data.crawler && (
                    <p className="mt-2 text-[0.75rem] text-muted">
                      Last run {relativeTime(data.crawler.startedAt)} ·{" "}
                      {data.crawler.pagesCrawled} pages · {data.crawler.status.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                loading={busy === "crawler"}
                onClick={() => sync("crawler", "the audit")}
                icon={<ScanSearch className="size-3.5" aria-hidden />}
              >
                Run audit
              </Button>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.875rem] font-semibold text-ink">Sync everything</p>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  Refreshes every connected provider and runs a fresh audit. Limited to three runs
                  every ten minutes.
                </p>
              </div>
              <Button
                variant="primary"
                loading={busy === "all"}
                onClick={() => sync("all", "everything")}
                icon={<RefreshCw className="size-3.5" aria-hidden />}
              >
                Sync now
              </Button>
            </div>
          </Panel>
        </div>
      )}

      <ConfirmDialog
        open={disconnecting !== null}
        onClose={() => setDisconnecting(null)}
        onConfirm={() => disconnecting && disconnect(disconnecting)}
        title="Disconnect this integration?"
        body={
          <>
            The stored credentials will be deleted and access revoked at Google. Historical figures
            already saved stay on the dashboard, but nothing new will be collected until you
            reconnect.
          </>
        }
        confirmLabel="Disconnect"
        loading={busy !== null}
      />
    </>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  blurb,
  connection,
  configured = true,
  configuredNote,
  disabled,
  disabledNote,
  canConnect,
  busy,
  syncKey,
  onConnect,
  onSync,
  onDisconnect,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  connection?: Connection;
  configured?: boolean;
  configuredNote?: string;
  disabled?: boolean;
  disabledNote?: string;
  canConnect: boolean;
  busy: string | null;
  syncKey: string;
  onConnect?: () => void;
  onSync?: () => void;
  onDisconnect?: () => void;
  children?: React.ReactNode;
}) {
  const status = connection?.status ?? "DISCONNECTED";

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-wash text-violet">
            <Icon className="size-4" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.875rem] font-semibold text-ink">{title}</p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium",
                  STATUS_TONE[status],
                )}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>

            <p className="mt-1 max-w-lg text-[0.8125rem] leading-relaxed text-muted">{blurb}</p>

            {connection?.accountLabel && (
              <p className="mt-2 text-[0.75rem] text-ink-soft">
                Account: <span className="font-medium">{connection.accountLabel}</span>
              </p>
            )}

            {connection?.lastSyncedAt && (
              <p className="mt-1 text-[0.75rem] text-muted">
                Last synced {relativeTime(connection.lastSyncedAt)}
              </p>
            )}

            {connection?.lastSyncError && (
              <p className="mt-2 flex items-start gap-1.5 text-[0.75rem] leading-relaxed text-amber-700">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{connection.lastSyncError}</span>
              </p>
            )}

            {!configured && configuredNote && (
              <p className="mt-2 max-w-lg text-[0.75rem] leading-relaxed text-muted">
                {configuredNote}
              </p>
            )}

            {disabled && disabledNote && (
              <p className="mt-2 text-[0.75rem] text-muted">{disabledNote}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onConnect && status !== "CONNECTED" && (
            <Button
              size="sm"
              variant="primary"
              disabled={!canConnect || disabled}
              loading={busy === "connect"}
              onClick={onConnect}
              title={canConnect ? undefined : "Your role cannot connect accounts."}
            >
              Connect
            </Button>
          )}

          {onConnect && status === "CONNECTED" && (
            <Button size="sm" disabled={!canConnect} onClick={onConnect}>
              Reconnect
            </Button>
          )}

          {onSync && (
            <Button
              size="sm"
              loading={busy === syncKey}
              disabled={disabled || !configured || status === "UNAVAILABLE"}
              onClick={onSync}
              icon={<RefreshCw className="size-3.5" aria-hidden />}
            >
              Sync now
            </Button>
          )}

          {onDisconnect && status === "CONNECTED" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={!canConnect}
              onClick={onDisconnect}
              icon={<Unplug className="size-3.5" aria-hidden />}
              aria-label={`Disconnect ${title}`}
            />
          )}
        </div>
      </div>

      {children && <div className="mt-4 border-t border-line pt-4">{children}</div>}
    </Panel>
  );
}

/**
 * Property selection.
 *
 * The lists come from the connected Google account, so nobody has to find a
 * numeric property ID by hand — which is the step this normally fails at.
 */
function PropertyPickers({
  websiteId,
  website,
  onSaved,
}: {
  websiteId: string;
  website: Response["website"];
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [gsc, setGsc] = useState(website.gscSiteUrl ?? "");
  const [ga4, setGa4] = useState(website.ga4PropertyId ?? "");

  const { data, loading } = useEndpoint<Properties>(
    `/api/admin/websites/${websiteId}/integrations/google/properties`,
  );

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/websites/${websiteId}`, {
        gscSiteUrl: gsc || null,
        ga4PropertyId: ga4 || null,
      });
      toast("Properties saved.", "success");
      onSaved();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-[0.8125rem] text-muted">Loading your Google properties…</p>;
  }

  if (!data?.connected) {
    return <p className="text-[0.8125rem] text-muted">{data?.reason ?? "Not connected."}</p>;
  }

  const changed = gsc !== (website.gscSiteUrl ?? "") || ga4 !== (website.ga4PropertyId ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
            Search Console property
          </span>
          <Select value={gsc} onChange={(event) => setGsc(event.target.value)}>
            <option value="">Not selected</option>
            {data.searchConsole.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.siteUrl}
              </option>
            ))}
          </Select>
          {data.searchConsole.length === 0 && (
            <span className="mt-1.5 block text-[0.75rem] text-muted">
              This Google account has no verified Search Console properties.
            </span>
          )}
        </label>

        <label className="min-w-0">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
            Analytics property
          </span>
          <Select value={ga4} onChange={(event) => setGa4(event.target.value)}>
            <option value="">Not selected</option>
            {data.analytics.map((property) => (
              <option key={property.propertyId} value={property.propertyId}>
                {property.displayName} ({property.propertyId})
              </option>
            ))}
          </Select>
          {data.analytics.length === 0 && (
            <span className="mt-1.5 block text-[0.75rem] text-muted">
              No Analytics properties are readable by this account.
            </span>
          )}
        </label>
      </div>

      {changed && (
        <Button size="sm" variant="primary" loading={saving} onClick={save} icon={<Check className="size-3.5" aria-hidden />}>
          Save properties
        </Button>
      )}
    </div>
  );
}

/** Feedback from the OAuth redirect, which cannot carry a toast across a navigation. */
function CallbackBanner({ status }: { status?: string }) {
  if (!status) return null;

  const messages: Record<string, { tone: "success" | "error" | "warning"; text: string }> = {
    connected: { tone: "success", text: "Google connected. Choose which properties to report on below." },
    cancelled: { tone: "warning", text: "The Google sign-in was cancelled. Nothing has changed." },
    failed: { tone: "error", text: "Google rejected the connection. Try connecting again." },
    invalid_state: {
      tone: "error",
      text: "That sign-in could not be verified, so it was refused. Start the connection again from this page.",
    },
    missing_code: { tone: "error", text: "Google did not return an authorisation code. Try again." },
    forbidden: { tone: "error", text: "Your role cannot connect accounts." },
    unknown_website: { tone: "error", text: "That website no longer exists." },
  };

  const message = messages[status];
  if (!message) return null;

  return (
    <div className="mb-4">
      <Banner tone={message.tone}>{message.text}</Banner>
    </div>
  );
}
