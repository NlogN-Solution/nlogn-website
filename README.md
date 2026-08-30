# nlogn — digital growth agency website

Marketing site, case studies and blog for nlogn, built with Next.js (App Router) and
Node.js route handlers. Static-first: 55 of 57 routes are prerendered at build time.

```bash
npm install
cp .env.example .env.local     # fill in as needed
npm run dev                    # http://localhost:3000
npm run build && npm start     # production
```

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16, App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4, design tokens in `src/app/globals.css` |
| Motion | `motion` (Framer Motion) for scroll and pointer effects; CSS keyframes above the fold |
| Content | MDX files in `src/content/blog`, parsed with gray-matter + next-mdx-remote |
| API | Next.js route handlers on the **Node.js runtime** (`src/app/api/*`) with zod, nodemailer |

## Design system

Everything visual derives from tokens declared in `@theme` in `src/app/globals.css`:
ink, canvas, violet ramp, three type families (Plus Jakarta Sans display, Inter body,
JetBrains Mono for labels and data), shadows and easing.

The signature motif is a real **n·log n curve**. `src/components/ui/growth-curve.tsx`
plots `y = n log₂ n` and every growth line on the site — the hero chart, the process
timeline markers, the section washes, the case-study cards — is generated from that one
function rather than drawn by hand.

Above-the-fold entrance animations use CSS keyframes (`.anim-in`, `.anim-pop`), so the
headline and hero card are never invisible waiting on JavaScript. `prefers-reduced-motion`
is respected globally.

## SEO

- **Metadata** — one helper, `buildMetadata()` in `src/lib/seo.ts`, produces title,
  description, canonical, Open Graph and Twitter tags for every page.
- **Structured data** — a connected `@graph` rather than disconnected islands.
  `ProfessionalService` and `WebSite` are emitted site-wide with stable `@id`s;
  pages add `Service`, `Article`, `BlogPosting`, `HowTo`, `FAQPage`, `VideoObject`,
  `CollectionPage`, `ContactPage` and `BreadcrumbList` that reference them.
- **Sitemap** — `src/app/sitemap.ts`, generated from content: pages, services, case
  studies, posts, categories and tags, with per-type priority and `lastModified`.
- **robots.txt** — `src/app/robots.ts`, with `/api/` disallowed.
- **RSS** — `/blog/rss.xml`, also advertised via `alternates.types` in the root layout.
- **Open Graph images** — generated at the edge by `src/app/opengraph-image.tsx`.
- **Redirects** — `next.config.ts` maps likely legacy and mistyped URLs to live ones.
- **Semantics** — one `h1` per page, breadcrumbs on every inner page, `details`/`summary`
  FAQs so answers stay in the DOM, descriptive link text, skip link, visible focus rings.
- **Headers** — HSTS, `nosniff`, frame options, referrer and permissions policy.

## Adding a blog post

Create `src/content/blog/your-slug.mdx`:

```mdx
---
title: "Post title"
description: "One or two sentences — this becomes the meta description."
date: "2026-09-01"
updated: "2026-09-04"      # optional
category: "Performance"    # creates /blog/category/performance
tags: ["Next.js", "LCP"]   # each creates /blog/tag/<slug>
author: "Kabin Bhattarai"
authorRole: "Founder & Engineering Lead"
featured: true             # optional — pins it to the top of /blog
keywords: ["optional", "extra keywords for schema"]
---

Body in MDX. `<Takeaway>` is available for a pull-out summary box.
```

The route, sitemap entry, RSS item, category page, tag pages, related-post links and
`BlogPosting` schema all follow automatically. Headings become anchors and feed the
table of contents.

## Forms

`POST /api/contact` and `POST /api/newsletter` run on the Node.js runtime. Both validate
with zod, rate-limit per IP (5 requests / 10 minutes, in-memory — swap
`src/lib/rate-limit.ts` for Redis if you run more than one instance), and the contact
form carries a honeypot field. Without SMTP credentials, submissions are validated and
logged rather than emailed, so previews never fail on missing secrets.

## Content to edit

Nearly all copy lives in `src/config/site.ts`: services, case studies, process steps,
team, values, stats, testimonials and FAQs. Change it there and every page that uses it
updates, including the schema and the sitemap.
