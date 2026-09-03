# nlogn platform API

Every endpoint lives in this Next.js app under `/api`. There is no separate
service to deploy, no CORS to configure, and no second set of environment
variables to keep in step.

## Response envelope

Every endpoint answers in one of two shapes.

```jsonc
// success
{ "success": true, "data": { /* … */ } }

// failure
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Please check the highlighted fields.", "fields": { "title": "Give it a title." } } }
```

`fields` appears only on `VALIDATION_ERROR`, and maps a form field to the
message the admin UI shows beneath it. Internal errors never carry a stack
trace or a database message — those go to the server log.

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Body failed schema validation; see `fields` |
| `UNAUTHORIZED` | 401 | No session, or the session was revoked |
| `FORBIDDEN` | 403 | Signed in, but the role lacks the capability |
| `NOT_FOUND` | 404 | No such record |
| `CONFLICT` | 409 | The write would break an invariant (see below) |
| `RATE_LIMITED` | 429 | Too many requests; honour `Retry-After` |
| `BAD_REQUEST` | 400 | Malformed request |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

## Authentication

An opaque random token in an `httpOnly`, `sameSite=lax` cookie
(`nlogn_admin_session`). The database stores only its SHA-256, so a leaked
table cannot be replayed as a login, and a logout, password change or account
disable revokes access on the very next request.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | `{ email, password }`. Rate limited to 5 per 15 min per IP. Same response for a wrong password and an unknown address. |
| `POST` | `/api/auth/logout` | session | Revokes the session server-side and clears the cookie |
| `GET` | `/api/auth/me` | session | `{ user, capabilities }` |

## Roles and capabilities

Roles map to capabilities in `src/server/permissions.ts`. Route handlers ask for
a capability, never a role, so adding a role is one table edit.

| Capability | Super admin | Content manager | Marketing manager | Viewer |
|---|:-:|:-:|:-:|:-:|
| `content:read` | ● | ● | ● | ● |
| `content:write` | ● | ● | ● | |
| `content:publish` | ● | ● | ● | |
| `content:delete` | ● | ● | | |
| `media:read` | ● | ● | ● | ● |
| `media:write` | ● | ● | ● | |
| `media:delete` | ● | ● | | |
| `messages:read` | ● | ● | ● | ● |
| `messages:write` | ● | | ● | |
| `settings:write` | ● | | ● | |
| `users:write` | ● | | | |

## Content

`{type}` is one of `blogs`, `insights`, `case-studies`. Blogs and insights share
a schema; case studies have their own structured one.

| Method | Path | Capability |
|---|---|---|
| `GET` | `/api/admin/{type}` | `content:read` |
| `POST` | `/api/admin/{type}` | `content:write` (+ `content:publish` to create as published) |
| `GET` | `/api/admin/{type}/:id` | `content:read` |
| `PATCH` | `/api/admin/{type}/:id` | `content:write` (+ `content:publish` to publish) |
| `DELETE` | `/api/admin/{type}/:id` | `content:delete` |

**List query parameters** — `page` (default 1), `perPage` (default 20, max 100),
`q`, `status` (`DRAFT` / `PUBLISHED` / `ARCHIVED` / `all`), `category`,
`sort` (`newest` / `oldest` / `updated` / `title`).

Responses carry `{ items, pagination: { page, perPage, total, totalPages, hasNext, hasPrev } }`.

**Article body** (blogs, insights):

```jsonc
{
  "title": "How AI is changing operations",
  "slug": "how-ai-is-changing-operations",   // optional; derived from the title
  "excerpt": "…",                            // optional; derived from the body
  "content": { "type": "doc", "content": [] },// TipTap JSON
  "status": "DRAFT",
  "featured": false,
  "categoryId": "…",
  "tagNames": ["nextjs", "performance"],     // resolved to ids, created if new
  "coverMediaId": "…",
  "seoTitle": "…", "seoDescription": "…", "canonicalUrl": "…",
  "ogImageId": "…", "noIndex": false,
  "scheduledFor": "2026-10-01T09:00:00Z"     // treated as a draft until due
}
```

Content is stored as TipTap JSON and rendered to HTML server-side by an
allow-list renderer (`src/server/content-render.ts`), so no stored markup is
ever trusted. Renaming a **published** slug writes a `Redirect` row, and the
public detail pages 301 from the old URL.

**Case study body** adds `projectName`, `clientName`, `industry`, `projectType`,
`challenge`, `approach` (string array), `solution`, `implementation`, `outcome`,
`technologies`, `servicesUsed`, `clientObjective`, `metrics`
(`[{ value, label }]`), `timeline`, `year`, `accent`, `testimonial*`,
`heroMediaId`, `thumbnailId`, `galleryIds`.

## Media

| Method | Path | Capability |
|---|---|---|
| `GET` | `/api/admin/media` | `media:read` — `q`, `type`, `folder`, `page`, `perPage` (max 60) |
| `POST` | `/api/admin/media` | `media:write` — `multipart/form-data` with `file` and `folder` |
| `GET` | `/api/admin/media/:id` | `media:read` — returns the record plus a reference count |
| `PATCH` | `/api/admin/media/:id` | `media:write` — `{ alt, caption }` |
| `DELETE` | `/api/admin/media/:id` | `media:delete` — `409` if referenced; repeat with `?force=true` |

Uploads are authenticated, then validated by **magic number** rather than by the
declared MIME type or the file extension, then streamed to Cloudinary under
`nlogn/{folder}`. The browser never talks to Cloudinary, so there is no unsigned
preset to abuse. Limits default to 10 MB images, 200 MB video, 20 MB documents
(`MEDIA_MAX_*_BYTES` to change).

## Messages, settings, users, system

| Method | Path | Capability |
|---|---|---|
| `GET` | `/api/admin/messages` | `messages:read` — `q`, `status`, `source`, paging |
| `GET` | `/api/admin/messages/:id` | `messages:read` — marks it read |
| `PATCH` | `/api/admin/messages/:id` | `messages:write` — `{ status, isRead, notes }` |
| `DELETE` | `/api/admin/messages/:id` | `messages:write` |
| `GET` / `PATCH` | `/api/admin/settings` | `settings:read` / `settings:write` |
| `GET` / `POST` | `/api/admin/users` | `users:read` / `users:write` |
| `PATCH` / `DELETE` | `/api/admin/users/:id` | `users:write` |
| `GET` / `POST` | `/api/admin/taxonomy` | `content:read` / `content:write` |
| `GET` | `/api/admin/activity` | `activity:read` |
| `GET` | `/api/admin/stats` | `content:read` |
| `GET` | `/api/admin/system` | `settings:read` — probes each integration |

The last active super admin cannot be demoted, disabled or deleted (`409`).
Changing a password or disabling an account revokes that person's sessions.

## Public endpoints

| Method | Path | Limit |
|---|---|---|
| `POST` | `/api/contact` | 5 per 10 min per IP |
| `POST` | `/api/newsletter` | 5 per 10 min per IP |
| `POST` | `/api/chat` | 20 per min per IP |

`/api/contact` keeps the original `{ message }` / `{ error }` shape so the
existing form component works unchanged. It accepts `packageName` and
`planSummary` carried over from the pricing pages, plus a `source`
(`CONTACT_FORM`, `PACKAGE_ENQUIRY`, `CUSTOM_QUOTE`, `GROWTH_STACK`,
`CHAT_WIDGET`). The record is written **before** either email is attempted, so a
temperamental SMTP server can never lose a lead. Without a database it still
sends the emails rather than refusing the submission.

A filled honeypot (`company_website`) gets a normal success response and is
dropped — telling a bot which field caught it just teaches it to avoid the field.

## SEO & website performance

Every endpoint below is capability-gated through `guard` like the rest of the
admin API, and every one that names a website resolves it through
`websiteRoute`, which loads the record and 404s before the handler runs. No
handler reads a website id off the request itself.

| Capability | Super admin | Content manager | Marketing manager | Viewer |
|---|:-:|:-:|:-:|:-:|
| `seo:read` | ● | ● | ● | ● |
| `seo:write` | ● | | ● | |
| `seo:connect` | ● | | | |

`seo:connect` is deliberately narrower than `seo:write`: triggering a sync is
routine, but granting this application access to a Google account is not.

### Websites

| Method | Path | Capability |
|---|---|---|
| `GET` | `/api/admin/websites` | `seo:read` |
| `POST` | `/api/admin/websites` | `seo:write` — `{ name, domain }` |
| `GET` | `/api/admin/websites/:id` | `seo:read` — website plus its connection statuses |
| `PATCH` | `/api/admin/websites/:id` | `seo:write` |
| `DELETE` | `/api/admin/websites/:id` | `seo:write` — cascades to all SEO data |

A domain is normalised to a bare hostname on write and checked against the SSRF
guard: one that resolves to a private, loopback or link-local address is a
`BAD_REQUEST`, not a stored record.

### Reports

All of these accept the shared range parameters and `refresh=1` to bypass the
cache.

`range` — `7d` · `28d` · `3m` · `6m` · `12m` · `custom` (with `start` and `end`
as `YYYY-MM-DD`). Ranges are measured in days so a period and the one before it
are always the same length, and they end yesterday rather than today. Custom
ranges are clamped to 16 months, which is all Search Console retains.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/websites/:id/seo/overview` | Cards, NLOGN health score, per-source connection state |
| `GET` | `/api/admin/websites/:id/analytics/overview` | GA4 totals, series, channels, devices, geography, top pages |
| `GET` | `/api/admin/websites/:id/search-console/overview` | Totals with comparison, daily series, country/device splits |
| `GET` | `/api/admin/websites/:id/search-console/queries` | Keyword table — `q`, `band`, `minClicks`, `minImpressions`, `sort`, `direction`, `page`, `perPage` |
| `GET` | `/api/admin/websites/:id/search-console/pages` | Landing pages — `q`, `page`, `perPage` |
| `GET` | `/api/admin/websites/:id/seo/opportunities` | Derived opportunities, each with its `basis` |
| `GET` | `/api/admin/websites/:id/seo/technical` | Crawl findings grouped by issue, with client-facing copy |
| `GET` | `/api/admin/websites/:id/backlinks` | Ahrefs, or `{ available: false, reason }` |
| `GET` | `/api/admin/websites/:id/performance` | PageSpeed lab and field metrics, kept separate |

`band` filters by position: `all`, `top3`, `top10`, `top20`, `21-50`, `51-100`.

Every provider-backed report answers in one of two shapes, so a disconnected
integration is a state rather than an error:

```jsonc
{ "connected": false, "reason": "Connect Google Search Console to see search rankings, clicks and impressions." }
{ "connected": true, "data": { /* … */ }, "fetchedAt": "2026-09-03T04:00:00Z", "stale": false }
```

`stale: true` means the provider could not be reached and the last successful
payload is being served instead. The UI renders "last updated …" rather than an
empty panel.

### Integrations

| Method | Path | Capability |
|---|---|---|
| `GET` | `/api/admin/seo/oauth/google/start?websiteId=` | `seo:connect` — returns the consent URL |
| `GET` | `/api/admin/seo/oauth/google/callback` | session + `seo:connect` — redirects back with a status |
| `GET` | `/api/admin/websites/:id/integrations` | `seo:read` — connection state and server configuration |
| `GET` | `/api/admin/websites/:id/integrations/google/properties` | `seo:write` — selectable GSC and GA4 properties |
| `POST` | `/api/admin/websites/:id/integrations/:provider/sync` | `seo:write` — 3 per 10 min per user per website |
| `DELETE` | `/api/admin/websites/:id/integrations/:provider` | `seo:connect` — revokes at Google, then deletes |

`:provider` is `google-search-console`, `google-analytics`, `pagespeed`,
`ahrefs`, `crawler`, or `all`.

**Credentials never reach the browser.** Connection rows are serialised through
`toPublicConnection`, which returns status, account label, scopes and sync
timestamps and drops every token column. Tokens are AES-256-GCM ciphertext in
the database (`server/crypto.ts`); with `SEO_TOKEN_ENCRYPTION_KEY` unset the app
refuses to store a credential rather than writing one in plaintext.

The OAuth `state` parameter is a signed payload carrying the website id, so the
callback proves both that the request originated here and which website it was
for. The callback also re-checks the session and the capability — a code
delivered to that URL by anyone else is refused.

### Scheduled sync

| Method | Path | Auth |
|---|---|---|
| `GET`/`POST` | `/api/cron/seo-sync` | `Authorization: Bearer $CRON_SECRET`, or `?key=` |

Compared in constant time. With `CRON_SECRET` unset the endpoint returns 503 for
everything — an open route that makes dozens of outbound API calls is an
amplification vector. `?crawl=1` adds the technical audit, which is otherwise
left off the nightly run because it is the slow step and the one that puts
requests on somebody else's server.

```jsonc
// vercel.json
{ "crons": [{ "path": "/api/cron/seo-sync", "schedule": "0 4 * * *" }] }
```

### What the providers do and do not give us

Documented here because several of these surface as UI copy, and the dashboard
must not imply a metric it cannot measure.

- **Search Console** finalises data 2–3 days late and retains 16 months. It
  publishes **no position-change metric** — the `positionChange` column is
  computed here by comparing two windows and is labelled "Calculated" in the UI.
  Query rows are sampled and anonymised, so per-query clicks sum to less than
  the site total.
- **GA4** needs the numeric property ID, not the `G-` measurement ID. The site
  loads Analytics only after cookie consent, so its figures are a subset of real
  visitors and will not match Search Console clicks. Geography and demographics
  are thresholded and legitimately return nothing on a low-traffic property.
- **PageSpeed** returns lab (Lighthouse) and field (CrUX) data. INP and TTFB are
  field-only, so a site without enough Chrome traffic has none — reported as
  absent, never substituted with TBT.
- **Ahrefs Webmaster Tools has no API.** API v3 requires a paid plan; the client
  probes `/subscription-info/limits-and-usage` plus each report endpoint on
  connect and renders only what the plan actually answered for.

### The crawler

`server/services/crawler.service.ts`, gated by `server/net-guard.ts`.

- http/https on ports 80/443 only.
- Hostnames are resolved and every returned address checked against the
  private, loopback, link-local, CGNAT, multicast and reserved ranges, v4 and
  v6, with IPv4-mapped v6 addresses unwrapped. Checking the hostname alone
  would not stop a public name resolving to `127.0.0.1`.
- Redirects are followed manually, one hop at a time, re-validating each — so a
  public URL that 302s to the metadata service is refused at the second hop.
- Response bodies are capped at 3 MB and requests at 15s.
- robots.txt is obeyed, including `Crawl-delay`; the crawl never leaves the
  website's own registered domain, and that domain comes from the database.
- Budgets: 60 pages, 4 minutes, and a floor of 400ms between requests.
