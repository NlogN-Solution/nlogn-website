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
