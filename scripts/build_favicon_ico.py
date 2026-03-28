"""Generate root favicon.ico (16, 32, 48) from the star mark — white bg, dark star."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]

# Same 8-point star as assets/favicon.svg (viewBox 0 0 64 64)
_STAR_64 = [
    (32, 10),
    (35.6, 20.4),
    (46, 24),
    (35.6, 27.6),
    (32, 38),
    (28.4, 27.6),
    (18, 24),
    (28.4, 20.4),
]


def _render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    scale = size / 64.0
    pts = [(round(x * scale), round(y * scale)) for x, y in _STAR_64]
    draw.polygon(pts, fill=(15, 23, 42, 255))
    return img


def main() -> None:
    master = _render(64)
    out = ROOT / "favicon.ico"
    master.save(out, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    # Optional crisp PNGs for hosts that prefer them
    png_dir = ROOT / "assets"
    _render(32).save(png_dir / "favicon-32.png", format="PNG")
    _render(48).save(png_dir / "favicon-48.png", format="PNG")
    print("Wrote", out)


if __name__ == "__main__":
    main()
