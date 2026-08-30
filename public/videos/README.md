# Showreel

Drop a file named `how-we-work.mp4` here and the "See How We Work" player will use it.

- Recommended: H.264/AAC MP4, 1920×1080, under 40 MB, with a poster frame baked into the first second.
- To serve it from a CDN instead, set `NEXT_PUBLIC_SHOWREEL_URL` in `.env.local`.
- With no file and no URL, the player falls back to the built-in animated process reel
  (`src/components/ui/process-reel.tsx`), so the experience never shows a broken player.
