# NLOGN studio — Next.js

The NLOGN animated homepage (originally the static `../nlogn-studio` HTML/CSS/JS
prototype), rebuilt as a statically rendered Next.js 16 App Router site.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

## Environment

| Variable         | Default                | Purpose                                                  |
| ---------------- | ---------------------- | -------------------------------------------------------- |
| `SITE_INDEXABLE` | unset (not indexable)  | Set to `true` at launch to drop `noindex` and open robots.txt. |
| `SITE_URL`       | `https://nlogn.online` | Base URL for Open Graph and other absolute metadata URLs. |

## Structure

```
src/
  app/
    layout.tsx        fonts (next/font), metadata, viewport
    page.tsx          composes the sections
    globals.css       all styles, same cascade order as the prototype
    icon.svg          favicon
    robots.ts         robots.txt, controlled by SITE_INDEXABLE
  content/site.ts     all copy, links, images; edit content here
  components/
    layout/           Header (mobile menu), Footer, Wordmark
    sections/         one component per page section
    motion/
      MotionProvider  pause state, reduced-motion preference, shared
                      rAF scroll loop (useScrollFrame), reveal observer
      ScrollEffects   reading progress, motion toggle, hero/project/studio
                      parallax, ink-on-scroll statement, contact arrow
    ui/ExternalLink   new-tab link with safe rel
public/images/        the eight WebP assets
```

Sections without behaviour are Server Components. Only the parts that react to
scroll or clicks are Client Components. Every scroll effect shares one
`requestAnimationFrame` loop in `MotionProvider`, as the prototype's
`updateMotion()` did.

### Motion

- Add the `reveal` class to any element to have it animate in on scroll.
  Content stays visible until `motion-ready` is set on `<html>`, so the page
  still works without JavaScript.
- The pause button and `prefers-reduced-motion` both toggle `motion-paused`
  on `<html>`.

### Images

Images go through `next/image` (AVIF/WebP, responsive `srcset`). Two of them
use unusually large `sizes` values on purpose. See the comments in
`Hero.tsx` and `Process.tsx`.
