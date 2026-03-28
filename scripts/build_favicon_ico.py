"""Generate root favicon.ico (16, 32, 48) + PNGs — white tile, centered solid blue star."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]

# Centered 8-point star — bbox center (32, 32) on 64×64 (matches assets/favicon.svg)
_STAR_64 = [
    (32, 18),
    (35.6, 28.4),
    (46, 32),
    (35.6, 35.6),
    (32, 46),
    (28.4, 35.6),
    (18, 32),
    (28.4, 28.4),
]

BLUE = (37, 99, 235, 255)
WHITE = (255, 255, 255, 255)
_HI = 256


def _render_bitmap(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), WHITE)
    draw = ImageDraw.Draw(img)
    scale = size / 64.0
    pts = [(round(x * scale), round(y * scale)) for x, y in _STAR_64]
    draw.polygon(pts, fill=BLUE)
    return img


def _render_hires_then_resize(out_size: int) -> Image.Image:
    return _render_bitmap(_HI).resize((out_size, out_size), Image.Resampling.LANCZOS)


def main() -> None:
    master = _render_hires_then_resize(64)
    out = ROOT / "favicon.ico"
    master.save(out, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    png_dir = ROOT / "assets"
    _render_hires_then_resize(32).save(png_dir / "favicon-32.png", format="PNG")
    _render_hires_then_resize(48).save(png_dir / "favicon-48.png", format="PNG")
    print("Wrote", out, "and assets/favicon-*.png")


if __name__ == "__main__":
    main()
