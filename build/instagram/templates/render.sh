#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Renderiza las plantillas HTML de Instagram a PNG con Chrome headless.
#
#   ./render.sh
#
# Salida: ../*.png (1080x1350 para posts/carrusel, 1080x1560 para el grid)
# ---------------------------------------------------------------------------
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "❌ No se encuentra Chrome en: $CHROME"; exit 1; }

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$(cd "$DIR/.." && pwd)"

shot () { # shot <archivo.html> <nSlide> <ancho> <alto> <nombre-salida> [extraQuery]
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 \
    --default-background-color=00000000 \
    --virtual-time-budget=4000 \
    --window-size="$3,$4" \
    --screenshot="$OUT/$5.png" \
    "file://$DIR/$1?only=$2${6:-}" >/dev/null 2>&1
  echo "  ✓ $5.png (${3}x${4})"
}

echo "▶ Carrusel (6 slides, 1080x1350 · 4:5)"
shot carousel.html 1 1080 1350 carousel-01-portada
shot carousel.html 2 1080 1350 carousel-02-contexto
shot carousel.html 3 1080 1350 carousel-03-dato
shot carousel.html 4 1080 1350 carousel-04-claves
shot carousel.html 5 1080 1350 carousel-05-foto
shot carousel.html 6 1080 1350 carousel-06-cta

echo "▶ Posts de feed (1080x1350 · 4:5)"
shot feed-post.html 1 1080 1350 post-a-noticia
shot feed-post.html 2 1080 1350 post-b-parte-finde
shot feed-post.html 3 1080 1350 post-c-spot-del-mes

echo "▶ Reels (1080x1920 · 9:16)"
shot reel.html 1 1080 1920 reel-01-portada
shot reel.html 2 1080 1920 reel-02-hook-subtitulos
shot reel.html 3 1080 1920 reel-03-endcard
shot reel.html 1 1080 1920 reel-00-zonas-seguras "&safe=1"

echo "▶ Stories (1080x1920 · 9:16)"
shot story.html 1 1080 1920 story-01-noticia-link
shot story.html 2 1080 1920 story-02-parte-viento
shot story.html 3 1080 1920 story-03-encuesta
shot story.html 4 1080 1920 story-04-ugc-countdown
shot story.html 2 1080 1920 story-00-zonas-seguras "&safe=1"

echo "▶ Vista de perfil (1080x1560)"
shot grid-preview.html 0 1080 1560 grid-preview

echo "✅ Listo. PNGs en: $OUT"

