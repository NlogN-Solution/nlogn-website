# The nlogn dashboard — operator's handbook

Everything the `/admin` dashboard does, how it is wired, what you set up once, and
which jobs are done **here** versus which stay in **Google Search Console** or
**Ahrefs**.

This is the "how it works and what do I do" guide. For the raw endpoint list see
[`API.md`](./API.md); for the marketing‑site content model see the root
[`README.md`](../README.md).

---

## 1. The shape of it

- **One app, one deployment.** The dashboard is not a separate service. It lives
  in the same Next.js app as the public website, under the `/admin` path. No CORS,
  no second server, no second set of secrets.
- **The public site does not need the dashboard.** Every database read on a public
  page is wrapped in a fallback (`dbRead`). If Postgres is down, the marketing
  site serves its committed MDX posts and hard‑coded case studies and returns
  `200`. Only `/admin` requires `DATABASE_URL`.
- **Static content is never migrated.** The committed blog posts in
  `src/content/blog` and the case studies in `src/config/site.ts` render exactly
  as before. The CMS *merges* its published records into the same lists. If a CMS
  post has the same slug as a committed file, **the file wins** and the CMS copy
  is hidden — the file's URL is the one Google already knows.
- **Publishing reaches the site within ~60 seconds.** Public pages are
  prerendered and revalidate every 60s; a build never needs the database.

### Data stores

| Store | What lives there |
|---|---|
| **Postgres (Neon)** | All CMS content, admin users, sessions, SEO connections, SEO metrics, crawl findings, cached report payloads |
| **Cloudinary** | Every uploaded image, video and document. The browser never talks to Cloudinary directly — uploads are signed server‑side after you are authenticated. |
| **Provider APIs** | Google Search Console, GA4, PageSpeed, Ahrefs — read on a schedule, never on page load |

---

## 2. Getting in

### First account

```bash
npm run db:migrate      # create the tables
npm run db:seed         # first super admin + default settings
```

`db:seed` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment. With no
`ADMIN_PASSWORD` it generates a strong one and prints it **once** — copy it then.
Re‑running the seed never overwrites an existing account.

Sign in at `/admin/login`. Rate limited to 5 attempts per 15 minutes per IP; a
wrong password and an unknown address give the identical response.

### How the session works

- The cookie (`nlogn_admin_session`) holds an opaque random token. The database
  stores only its SHA‑256, so a leaked database table cannot be replayed as a
  login.
- Middleware only checks the cookie exists. The **real** gate is the admin layout,
  which resolves the token against the database on every request — so a logout, a
  password change, or disabling an account locks that person out on their **next
  request**, not at cookie expiry.

### Roles and what each can do

Roles map to *capabilities*, and the navigation hides sections you cannot use.

| | Super admin | Content manager | Marketing manager | Viewer |
|---|:-:|:-:|:-:|:-:|
| Read content / media / messages / activity | ✅ | ✅ | ✅ | ✅ |
| Write & publish content | ✅ | ✅ | ✅ | — |
| Delete content / media | ✅ | ✅ | — | — |
| Reply‑state on messages (`messages:write`) | ✅ | — | ✅ | — |
| Change Settings | ✅ | — | ✅ | — |
| Manage admin users | ✅ | — | — | — |
| View the SEO dashboard (`seo:read`) | ✅ | ✅ | ✅ | ✅ |
| Trigger an SEO sync / run a crawl (`seo:write`) | ✅ | — | ✅ | — |
| **Connect a Google account (`seo:connect`)** | ✅ | — | — | — |

`seo:connect` is deliberately kept to the super admin alone: triggering a sync is
routine, but granting this app access to a Google account is not.

The last active super admin cannot be demoted, disabled, or deleted.

---

## 3. The CMS sections

Left‑hand navigation, top to bottom:

| Section | Path | What it is for |
|---|---|---|
| **Dashboard** | `/admin` | Operational overview — drafts waiting, unread messages, storage used, recent activity. Static and CMS content are counted separately. |
| **SEO & traffic** | `/admin/seo` | The search / analytics / performance dashboard. Section 4 below. |
| **Blogs** | `/admin/blogs` | Long‑form articles → `/blog/<slug>` |
| **Insights** | `/admin/insights` | Shorter posts → `/insights/<slug>`. Same schema as blogs. |
| **Case studies** | `/admin/case-studies` | Structured project write‑ups with metrics, testimonial, gallery |
| **Media library** | `/admin/media` | Everything uploaded to Cloudinary. Delete is blocked while a file is referenced (repeat with force to override). |
| **Messages** | `/admin/messages` | Contact‑form and newsletter enquiries. Opening one marks it read. |
| **Settings** | `/admin/settings` | Site name, contact details, WhatsApp number, default SEO title/description/OG image, notification recipients, social links |
| **Admin users** | `/admin/users` | Invite / disable admin accounts, set roles |
| **Activity log** | `/admin/activity` | Who did what, when |
| **System status** | `/admin/system` | Live probe of database, SMTP, Cloudinary, analytics tag, AI key |

### Settings: defaults, not replacements

Every setting *falls back* to the value committed in `src/config/site.ts`. The
database only ever overrides. A missing settings row degrades to the committed
value on the live site rather than to an empty string. Settings are cached for
30 seconds.

### System status probes, it does not just report

Each integration is actually exercised — a `SELECT 1` against the database, an
SMTP handshake, and so on. An environment variable being *set* tells you nothing
about whether the credential still *works*, so the page does not rely on that.

---

## 4. Content: how publishing behaves

Blogs and insights share one schema and one code path. Case studies have their own
structured schema. All three follow the same lifecycle.

### Draft → scheduled → published → archived

| Status | On the public site |
|---|---|
| `DRAFT` | Not visible |
| `PUBLISHED` with `scheduledFor` in the future | Treated as a draft until the time passes |
| `PUBLISHED` (no schedule, or schedule passed) | Live within ~60s |
| `ARCHIVED` | Not visible; kept for history |

- First publish stamps `publishedAt`. Later edits leave it alone. Moving back to
  draft clears it.
- Creating a post *as published* requires `content:publish` on top of
  `content:write`.

### Slugs and redirects

- The slug is derived from the title, kept unique with a numeric suffix if it
  collides.
- **Renaming the slug of a published post writes a `Redirect` row**, and the old
  URL 301s to the new one automatically. You will not break an indexed link by
  renaming.

### The body is never trusted markup

Content is stored as TipTap editor JSON and rendered to HTML server‑side by an
allow‑list renderer (`src/server/content-render.ts`). No stored markup is ever
injected raw. Reading time is computed from the text.

### Per‑article SEO fields

Each blog/insight/case study carries its own:

- `seoTitle`, `seoDescription` — override the auto‑generated `<title>` / meta
  description for that page
- `canonicalUrl` — point Google at a different URL as the official one
- `ogImageId` — the social‑share image
- `noIndex` — tell Google not to list this page

If you leave these blank the page uses the site defaults from **Settings**, and
the title/description are derived from the post.

### Media uploads

Uploads are authenticated, then validated by **magic number** (the actual file
bytes), not by the file extension or the declared type, then streamed to
Cloudinary under `nlogn/<folder>`. Default ceilings: 10 MB images, 200 MB video,
20 MB documents — override with `MEDIA_MAX_IMAGE_BYTES` / `_VIDEO_` / `_DOC_`.

---

## 5. The SEO & Traffic dashboard

This is the part with the most moving pieces, so it gets its own model.

### 5.1 The core concept: a "Website"

Everything in the SEO dashboard hangs off a **Website** record: a name and a
canonical domain (`nlogn.online`, lowercase, no scheme, no trailing slash). It
also stores:

- `gscSiteUrl` — which Search Console property this reports on
  (`sc-domain:nlogn.online` or `https://nlogn.online/`)
- `ga4PropertyId` — the **numeric** GA4 property ID (not the `G‑…` tag)
- `ahrefsDomain` — reserved for Ahrefs

Add one at `/admin/seo` (if there is exactly one website, that page redirects
straight into its dashboard). A domain that resolves to a private / loopback /
link‑local address is rejected at creation — the crawler would refuse it anyway.

Deleting a website cascades to **all** its SEO data (connections, metrics,
issues, cache).

### 5.2 The five data sources

| Source | Gives you | Needs |
|---|---|---|
| **Google Search Console** | Clicks, impressions, CTR, average position, the actual search queries, landing pages, country/device splits, sitemap status | A connected Google account + a selected GSC property |
| **Google Analytics (GA4)** | Visitors, sessions, engagement, traffic channels, top pages, geography, devices | The **same** Google connection + a selected GA4 property |
| **PageSpeed Insights** | Lighthouse lab scores + real‑visitor (CrUX) field data for mobile and desktop | `PAGESPEED_API_KEY` on the server |
| **Ahrefs** | Backlinks, referring domains, domain rating, organic keyword counts | A **paid** Ahrefs plan with API v3 access + `AHREFS_API_TOKEN` |
| **The built‑in crawler** | Technical findings no API provides: titles, meta descriptions, canonicals, alt text, broken links, page weight, mixed content, viewport, sitemap/robots checks | Nothing — it ships with the app |

Every provider‑backed panel answers in one of two shapes, so a disconnected
integration is a **state**, not an error:

```jsonc
{ "connected": false, "reason": "Connect Google Search Console to see search rankings…" }
{ "connected": true, "data": { … }, "fetchedAt": "2026-09-03T04:00:00Z", "stale": false }
```

`stale: true` means the provider could not be reached and the **last successful
payload** is being shown, with its timestamp. You get "last updated 6 hours ago",
never a blank panel.

### 5.3 The NLOGN SEO Health Score

A single 0–100 number at the top of the dashboard. **It is ours** — Google and
Ahrefs publish no such score — so it is labelled that way everywhere and every
component is shown alongside the total.

| Component | Weight | Built from |
|---|:-:|---|
| Technical health | 35 | Crawl findings, weighted by severity |
| Search visibility trend | 25 | Clicks + position change vs the previous period (Search Console) |
| Click‑through rate | 15 | Site‑wide CTR (Search Console) |
| Page speed | 15 | Mobile Lighthouse performance score |
| Organic traffic trend | 10 | Organic users vs previous period (GA4) |

Two rules keep it honest: a component **with no data is excluded**, not scored as
zero (a site with no PageSpeed data yet is not an unhealthy site); and the total
is re‑weighted across whatever *was* measured, with the response saying how many
of the five inputs that was. A score from two of five inputs is shown as such.

### 5.4 The dashboard sections, in order

They are ordered the way a client reads them — what happened, where the traffic
came from, how Google sees the site, what to do, then the technical detail. Each
fetches independently, so one slow provider costs one panel, not the page.

1. **Overview** — the health score, the headline cards (organic users, clicks,
   impressions, CTR, position, and Ahrefs cards when the plan answers for them),
   and per‑source connection state.
2. **Traffic** (GA4) — visitors over time, channels, devices, geography, top pages.
3. **Search** (Search Console) — clicks/impressions/CTR/position with
   period‑over‑period comparison, daily series, country and device splits.
4. **Keywords** (Search Console) — the query table. Filter by position band
   (`top3`, `top10`, `top20`, `21‑50`, `51‑100`), min clicks, min impressions.
5. **Pages** (Search Console) — landing‑page performance.
6. **Opportunities** — *derived* suggestions (see 5.6).
7. **Technical** — crawler findings, grouped by issue with plain‑language
   "what / why / fix" copy.
8. **Backlinks** (Ahrefs) — or a panel explaining why it is unavailable.
9. **Performance** (PageSpeed) — lab and field Core Web Vitals, kept separate,
   mobile and desktop, with a score trend.

### 5.5 Date ranges

`7d · 28d · 3m · 6m · 12m · custom`. Ranges are measured in whole days so a
period and the one before it are always the same length, and they **end
yesterday**, not today. Custom ranges are clamped to 16 months — all Search
Console keeps. The default is 28 days.

### 5.6 What the dashboard calculates itself (and says so)

- **Position change** per keyword. Search Console publishes **no**
  position‑change metric; the dashboard computes it by comparing two windows and
  labels the column as derived.
- **Opportunities.** Every number quoted is one Google reported; the *judgement*
  that it is an opportunity is ours, and each opportunity states its `basis`.
  The four kinds:
  - *Close to page one* — positions 11–20 with ≥100 impressions.
  - *Seen but not clicked* — ranking top‑10, ≥500 impressions, CTR well below
    **this site's own median CTR** at that position band (no external "expected
    CTR" table is used).
  - *Popular but ranking low* — CTR well above the site's median for its band,
    but ranked past page one.
  - *Losing ground* — position slipped more than 3 places vs the previous window.

### 5.7 The crawler, precisely

`src/server/services/crawler.service.ts`, gated by `src/server/net-guard.ts`.

- HTTP/HTTPS on ports 80/443 only. Every hostname is resolved and **every
  returned address** is checked against private / loopback / link‑local / CGNAT /
  multicast / reserved ranges (v4 and v6). Redirects are followed one hop at a
  time, re‑validating each — a public URL that 302s to a cloud metadata endpoint
  is refused at the second hop.
- Never leaves the website's own registered domain, and that domain comes from
  the database, never from a request.
- Obeys `robots.txt`, including `Crawl-delay`.
- Budgets: **60 pages, 4 minutes**, minimum 400 ms between requests, 3 MB body
  cap, 15 s per request.
- Findings are stored one row per `(issue, URL)`. A re‑crawl updates
  `lastSeenAt`; anything not seen this time is stamped **resolved** rather than
  deleted, so "recently resolved" is real history.

Issue catalogue (severity → meaning) lives in `src/config/seo-issues.ts`, in the
words a client should read. `CRITICAL` = can stop Google indexing the page at
all; `HIGH` = likely costing traffic now; `MEDIUM` = fix it, nothing is broken;
`LOW` = an optimisation.

### 5.8 How data actually gets in: sync vs refresh vs cron

Nothing is fetched from a provider on page load. Three mechanisms put data in:

| Trigger | Where | What it does |
|---|---|---|
| **Refresh** (↻ on the dashboard) | `/admin/seo/<id>` | Re‑reads every panel from the providers, bypassing the report cache. Fast. Does **not** crawl or run Lighthouse. |
| **Sync now** (per provider) | `/admin/seo/<id>/integrations` | Full sync of that one provider — fetches, writes the metric tables, updates the connection's status. Rate limited to 3 per 10 min per user per website. The Ahrefs and crawl syncs are the slow ones. |
| **Scheduled sync** | `GET/POST /api/cron/seo-sync` | Every active website, every provider. Auth: `Authorization: Bearer $CRON_SECRET`. Add `?crawl=1` to include the crawl (left out of the nightly run by default because it is slow and it hits someone else's server). |

**Report cache TTLs** (`src/server/services/seo-cache.service.ts`): Search
Console 6 h, GA4 3 h, PageSpeed 24 h, Ahrefs 24 h, property lists 12 h. Expired
rows are **kept, not deleted** — they are what the "stale" fallback serves when a
provider is down.

**Provider lag the UI accounts for:** Search Console finalises data 2–3 days
late (`SEARCH_CONSOLE_LAG_DAYS = 3`); GA4 is 1 day. There is no "today" for
either.

---

## 6. Integrations — one‑time setup

Open `/admin/seo/<website>/integrations`. It reports two different failures
separately because they have different fixes: a **server env var missing** is a
deploy change; a **provider not connected for this website** is a button click.

### 6.1 Google — Search Console + Analytics (one connection covers both)

**A. In Google Cloud Console (once, by a developer):**

1. Create an OAuth 2.0 Client ID (type: Web application).
2. Add the authorised redirect URI, exactly:
   `https://<your-domain>/api/admin/seo/oauth/google/callback`
3. Enable the **Search Console API** and the **Google Analytics Data API** for the
   project.
4. Put the credentials in the server environment:
   ```
   GOOGLE_OAUTH_CLIENT_ID=…
   GOOGLE_OAUTH_CLIENT_SECRET=…
   GOOGLE_OAUTH_REDIRECT_URI=https://<your-domain>/api/admin/seo/oauth/google/callback
   SEO_TOKEN_ENCRYPTION_KEY=…    # openssl rand -base64 32
   ```
   Without `SEO_TOKEN_ENCRYPTION_KEY` the app **refuses to store** a credential
   rather than writing a token in plaintext, and the Connect button is disabled.

**B. In the dashboard (super admin, `seo:connect`):**

5. Click **Connect Google Search Console**. You go to Google's own consent
   screen. The scopes requested are **read‑only** — this dashboard reports, it
   never writes to your Google properties. Sign in with the Google account that
   has access to the Search Console property and the GA4 property.
6. Back in the dashboard, pick the **Search Console property** and the **GA4
   property** from the dropdowns (populated from what that Google account can
   actually read). GA4 needs the numeric property ID — the picker handles that;
   don't paste the `G‑…` measurement ID.
7. **Sync now** on each.

**What must be true on Google's side:** the connected Google account needs at
least *restricted* (read) permission on the Search Console property, and *Viewer*
on the GA4 property. Unverified properties are filtered out of the picker because
every data call against them would 403.

**Token handling:** the refresh token is AES‑256‑GCM ciphertext in the database.
Access tokens are refreshed automatically. If Google revokes the grant the
connection flips to `NEEDS_REAUTH` and the dashboard tells you to reconnect; a
Google 5xx is treated as transient and does *not* nag you to reconnect.

### 6.2 PageSpeed Insights

```
PAGESPEED_API_KEY=…
```

Optional but strongly recommended — Google throttles keyless requests heavily.
The free tier is 25,000 runs/day, far more than this uses. No per‑website
connection step; once the key is set, **Sync now** on the PageSpeed card runs
mobile + desktop Lighthouse and stores the result. INP and TTFB are **field‑only**
metrics, so a low‑traffic site legitimately has none — reported as absent, never
substituted.

### 6.3 Ahrefs — read this before expecting backlinks

> **Ahrefs Webmaster Tools (the free tier) has no API.** None. It is a web
> interface only. Site Audit, Site Explorer for verified domains and Web
> Analytics are all real, and none is reachable programmatically.

API v3 exists **only on paid plans** (Lite and up, as of early 2026), is metered
in "units" (~50 minimum per call), and is rate limited to ~60 requests/minute.

```
AHREFS_API_TOKEN=…    # only exists on a plan that includes API access
```

When a token is present the app **probes** what the plan actually permits — it
calls the subscription endpoint, then tries each report with a 1‑row request —
and renders only the reports that answered. Anything the plan does not include is
**hidden, not estimated**. With no token, or a free‑tier token, the Backlinks
section shows a short explanation instead of empty cards.

The memory note [`ahrefs-free-tier-no-api`] records this too: the panel being
disabled is deliberate.

### 6.4 The crawler

No setup. It runs on **Sync now** (with the crawl option) on the integrations
page, or nightly if you pass `?crawl=1` to the cron endpoint.

---

## 7. Your side vs. the dashboard — the direct answer

You asked specifically: *do I still do things in Google Search Console / Ahrefs,
or is everything here?*

**Short version:** this dashboard is **read‑only reporting plus its own crawl**.
It pulls numbers *out* of Google and Ahrefs and reframes them for clients. It
does **not** replace the setup, verification, and submission work you do inside
those tools. Think of it as a nicer lens, not a substitute console.

### Google Search Console

| Task | Where |
|---|---|
| Verify ownership of the domain | **In Search Console** (one‑time, DNS TXT or the site already serves the meta tag) |
| Submit / resubmit your `sitemap.xml` | **In Search Console** (the app *reads* sitemap status via API but does not submit) |
| Request indexing of a specific new URL | **In Search Console** (URL Inspection → Request Indexing) |
| Fix a manual action / security issue | **In Search Console** |
| Set a country target, handle domain moves | **In Search Console** |
| Remove a URL from results urgently | **In Search Console** (Removals tool) |
| See clicks, impressions, CTR, position over time | **Here** (Search section) — nicer, with comparisons |
| See which queries and pages drive search traffic | **Here** (Keywords / Pages sections) |
| See position *changes* per keyword | **Here only** — Search Console doesn't expose this; the app computes it |
| Get prioritised "what to work on" suggestions | **Here** (Opportunities) — Search Console has none of this |
| Spot‑check whether one URL is actually indexed | Search Console UI, or the app's URL‑inspection call (quota: 2,000/day) |

The app's Search Console API access is **read‑only** — it cannot change anything
in your Search Console account even if it wanted to.

### Google Analytics

| Task | Where |
|---|---|
| Install / keep the tracking tag running | Already on the site (`components/site/analytics.tsx`), independent of this dashboard. Loads only **after cookie consent**, so its numbers are a subset of real visitors and won't match Search Console clicks. |
| Configure key events / conversions, audiences, filters | **In GA4** |
| Day‑to‑day "how's traffic" reporting for a client | **Here** (Traffic section) |
| Deep exploration, funnels, custom reports | **In GA4** |

### Ahrefs

| Task | Where |
|---|---|
| Actually build backlinks / do outreach | Your job, in the world |
| Run a full Site Audit, explore competitors, keyword research | **In Ahrefs** (the web app — the free Webmaster Tools included) |
| Show a client their backlink count, referring domains, DR, organic keyword count | **Here** (Backlinks section) — **only if** the agency has a paid API plan and `AHREFS_API_TOKEN` is set |
| Nothing, if you're on the free tier | The section stays hidden by design; use the Ahrefs web UI |

### The crawler covers the gap

The things **no** API gives you — missing titles, duplicate meta descriptions,
broken links, thin content, missing alt text, mixed content, canonical mistakes,
missing sitemap/robots — are what the built‑in crawler checks on every sync. That
is genuinely "done here" and needs nothing external.

---

## 8. Environment variables

| Variable | Needed for | If missing |
|---|---|---|
| `DATABASE_URL` | The whole dashboard | `/admin` shows "CMS not configured"; public site is fine |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Media uploads | Upload fails; existing URLs still resolve |
| `MEDIA_MAX_IMAGE_BYTES` / `_VIDEO_BYTES` / `_DOC_BYTES` | Upload ceilings | Defaults 10 MB / 200 MB / 20 MB |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | `db:seed` only | Password auto‑generated and printed once |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `CONTACT_TO` | Enquiry + acknowledgement emails | Submissions are validated and logged, not emailed — never lost |
| `NEXT_PUBLIC_SITE_URL` | Canonicals, sitemap, RSS, OG | Falls back to `siteConfig.url` |
| `ANTHROPIC_API_KEY` | Chat widget's AI assistant | Widget opens and hands the visitor to WhatsApp |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` | Override the built‑in analytics tag | Uses `siteConfig.gaId` |
| **`GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI`** | Connecting Search Console + GA4 | Connect button disabled, with a banner |
| **`SEO_TOKEN_ENCRYPTION_KEY`** | Storing **any** SEO credential (also signs the OAuth `state`) | App refuses to store credentials; connecting disabled |
| `PAGESPEED_API_KEY` | PageSpeed / Core Web Vitals | Section unavailable (keyless is throttled too hard to rely on) |
| `AHREFS_API_TOKEN` | Backlinks section | Section hidden with an explanation |
| **`CRON_SECRET`** | The scheduled sync endpoint | `/api/cron/seo-sync` returns 503 for everything |

`DATABASE_TRANSPORT` and `NODE_OPTIONS=--no-network-family-autoselection` — see
Troubleshooting.

---

## 9. Deployment & the nightly sync

The app is a standard Next.js deploy. The one dashboard‑specific piece is the
cron job, and **it is not wired up yet** (there is no `vercel.json`).

To enable the nightly SEO sync on Vercel, add `vercel.json`:

```jsonc
{
  "crons": [
    { "path": "/api/cron/seo-sync",        "schedule": "0 4 * * *" },
    { "path": "/api/cron/seo-sync?crawl=1", "schedule": "0 3 * * 0" }
  ]
}
```

and set `CRON_SECRET` in the project (Vercel Cron sends it as the `Authorization`
header automatically). The example runs providers nightly at 04:00 and adds the
crawl once a week. On another host, hit the same URL from any scheduler with
`Authorization: Bearer <CRON_SECRET>`.

`db:deploy` runs the migrations in CI/CD (`prisma migrate deploy`).

---

## 10. Troubleshooting

### "Can't connect to the Neon database locally"

Node's Happy‑Eyeballs on an IPv4‑only network. Symptom: `npm run db:doctor`
shows every transport `ETIMEDOUT` while `curl` reaches the host fine. Fix is
already wired into the npm scripts via `cross-env NODE_OPTIONS=--no-network-family-autoselection`.
If a new machine/network still fails, run `npm run db:doctor` — it prints which
transport works and the `DATABASE_TRANSPORT=` value to set (`http` / `ws` /
`tcp`). See the memory note [`neon-ipv6-autoselect-fix`].

### The dev server dies with `ENOSPC: no space left on device`

Turbopack's cache in `.next/` grew until the disk filled. Clear it:

```bash
rm -rf .next
```

It is fully regenerated on the next `npm run dev` / `npm run build`. `.git` and
`node_modules` are also large; `git gc` and a clean `npm ci` reclaim more.

### A panel says "last updated N hours ago" / `stale`

The provider could not be reached on the last sync and the cached payload is
being served. Check that provider's card on the integrations page for the actual
error, then **Sync now**.

### "Reconnect needed" on Google

The refresh token was rejected (usually revoked in the Google account's security
settings, or the OAuth consent screen is still in "testing" and the 7‑day test
token expired). Reconnect from the integrations page. For a production app,
publish the OAuth consent screen in Google Cloud Console.

### Backlinks section is empty / hidden

Expected on the Ahrefs free tier — it has no API. Only a paid plan with API v3
and `AHREFS_API_TOKEN` turns it on. See §6.3.

### PageSpeed shows lab data but no "field" numbers

Normal for a low‑traffic site — field (CrUX) data needs enough real Chrome
visitors for Google to report it. Not a fault.

### Search Console clicks ≠ GA4 organic users

Expected. GA4 only counts visitors who accepted cookie consent; Search Console
counts all clicks. Different denominators, and the docs say so in the UI.

---

## 11. Known issues in the current tree (2026‑09‑04)

These were found while writing this guide and are **not yet fixed**:

1. **Committed merge‑conflict markers** in four SEO files —
   `src/components/admin/seo/dashboard.tsx`, `.../seo/hooks.ts`,
   `.../seo/integrations.tsx`, and
   `src/server/services/seo-opportunities.service.ts`. `npx tsc --noEmit` fails
   on them and the SEO dashboard section will not build until they are resolved.
   They came in with commit `49be5b2`. There is a `git stash` entry
   (`unfinished feature backup`) that is the other side of the conflict. In each
   case the `<<<<<<< Updated upstream` side is the current‑branch code; the
   `>>>>>>> Stashed changes` side is the older stashed version.
2. **Disk near full** — the working disk is ~98% used; the Turbopack cache
   filled it and crashed `next dev` mid‑session. Clear `.next` (see §10).

---

## 12. File map

| Concern | Files |
|---|---|
| Auth & sessions | `src/server/auth.ts`, `src/server/middleware/guard.ts`, `src/app/admin/(shell)/layout.tsx` |
| Roles | `src/server/permissions.ts`, `src/config/roles.ts` |
| DB client & fallback | `src/server/db.ts` |
| Content | `src/server/services/article.service.ts`, `case-study.service.ts`, `content-render.ts` |
| Public merge (static + CMS) | `src/server/public-content.ts` |
| SEO orchestration | `src/server/services/seo-overview.service.ts`, `seo-sync.service.ts`, `seo-cache.service.ts`, `seo-health.service.ts` |
| SEO per‑provider | `search-console.service.ts` + `integrations/search-console.ts`; `analytics.service.ts` + `integrations/ga4.ts`; `pagespeed.service.ts` + `integrations/pagespeed.ts`; `ahrefs.service.ts` + `integrations/ahrefs.ts` |
| OAuth | `src/server/integrations/google-oauth.ts`, `src/app/api/admin/seo/oauth/google/*` |
| Crawler | `src/server/services/crawler.service.ts`, `src/server/net-guard.ts`, `src/config/seo-issues.ts` |
| SEO UI | `src/components/admin/seo/*`, `src/app/admin/(shell)/seo/*` |
| Cron | `src/app/api/cron/seo-sync/route.ts` |
| Schema | `prisma/schema.prisma` |
