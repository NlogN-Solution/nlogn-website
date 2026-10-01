"""
Prepares the eye close-up the home hero pushes into.

Source: public/eagle-closeup.png — a sharp 1254x1254 photograph of the same
eagle's eye, supplied for the extreme close-up the hero's own 1760px image
cannot hold (its iris is ~16px across; here it is ~266px).

This only re-encodes it for the web: same pixels, WebP at high quality. The
hero lays it over the photograph with its iris matched to the photo's iris,
then re-anchors on its pupil (see CLOSE in components/home/home-scene.tsx).
If the source is replaced, re-measure CLOSE there.

Output: public/hero/eagle-eye-closeup.webp.
Run with: python3 scripts/generate-eye-closeup.py (needs Pillow).
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "eagle-closeup.png"
OUT = ROOT / "public" / "hero" / "eagle-eye-closeup.webp"

img = Image.open(SRC).convert("RGB")
OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, "WEBP", quality=92, method=6)
print(f"wrote {OUT.relative_to(ROOT)} {img.size[0]}x{img.size[1]} ({OUT.stat().st_size // 1024} KB)")
