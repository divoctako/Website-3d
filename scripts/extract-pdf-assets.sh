#!/usr/bin/env bash
# Extracts images from the BYD Sealion 7 brochure into public/assets as WebP.
# Requires poppler-utils (pdfimages) and ImageMagick.
# Usage: scripts/extract-pdf-assets.sh [path/to/brochure.pdf]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PDF="${1:-$ROOT/source/BYD_SEALION_7.pdf}"
OUT="$ROOT/public/assets"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"
pdfimages -j -p "$PDF" "$TMP/i" 2>/dev/null

# opaque <name> <image> [max-width]
opaque() {
  convert "$TMP/$2" -resize "${3:-2400}x>" -quality 82 "$OUT/$1.webp"
}

# cutout <name> <rgb> <mask> [max-width] — merges RGB + soft mask, trims to the subject
cutout() {
  local f="$TMP/$2"
  local size; size="$(identify -format '%wx%h' "$f")"
  # bounding box of the subject, taken from the thresholded mask
  local box; box="$(convert "$TMP/$3" -colorspace gray -resize "$size!" -threshold 4% -format '%@' info:)"
  convert "$f" \( "$TMP/$3" -colorspace gray -resize "$size!" \) \
    -alpha off -compose CopyOpacity -composite -crop "$box" +repage \
    -resize "${4:-2000}x>" -quality 88 -define webp:alpha-quality=95 "$OUT/$1.webp"
}

# Page 1
opaque hero            i-001-000.jpg
# Page 2 — performance / exterior
opaque bg-sky-mist     i-002-019.jpg 1800
opaque bg-swirl        i-002-023.jpg 1600
cutout car-side        i-002-024.jpg i-002-025.ppm
cutout car-front       i-002-026.jpg i-002-027.ppm
opaque detail-headlight i-002-028.jpg
opaque detail-taillight i-002-029.jpg
opaque detail-wheel    i-002-030.jpg
opaque detail-tailgate i-002-031.jpg
# Page 3 — interior / ADAS
opaque speed-lines     i-003-043.jpg 1400
opaque adas-road       i-003-048.jpg 1600
opaque interior-dash   i-003-050.jpg
opaque interior-wide   i-003-051.jpg
opaque interior-shifter i-003-052.jpg
opaque interior-audio  i-003-053.jpg
opaque interior-cabin  i-003-054.jpg
opaque interior-roof   i-003-055.jpg
opaque interior-blue   i-003-056.jpg
opaque interior-dms    i-003-057.jpg
opaque interior-hud    i-003-058.jpg

# Page 4 — exterior colours (RGB + mask pairs; only ~240 px wide in the brochure)
cutout car-color-horizon-white i-004-072.jpg i-004-073.jpg
cutout car-color-space-grey    i-004-074.jpg i-004-075.jpg
cutout car-color-quantum-black i-004-076.jpg i-004-077.jpg
cutout car-color-pulse-purple  i-004-078.jpg i-004-079.jpg
cutout car-color-solar-red     i-004-080.jpg i-004-081.jpg
cutout car-color-shark-grey    i-004-082.jpg i-004-083.jpg

echo "Assets written to $OUT"
ls -la "$OUT"
