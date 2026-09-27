#!/usr/bin/env bash
#
# Download (optional) and encode a clip into the web-optimised variants used by
# the Stage banner.
#
# USAGE (can be run from any directory)
#   Positional form (no flags needed):
#     ./build/youtube/encode-web.sh <url|file> <start> <end> <name>
#     ./build/youtube/encode-web.sh "https://youtu.be/fUYJC70G43o" 10:11:59 10:12:19 teahupoo
#     ./build/youtube/encode-web.sh clip.mp4 teahupoo          # local file, full clip
#
#   Flag form (equivalent):
#     ./build/youtube/encode-web.sh -u <url> -s <start> -e <end> <name>
#     ./build/youtube/encode-web.sh -i clip.mp4 teahupoo
#
#   Keep the downloaded 4K master instead of deleting it:
#     ./build/youtube/encode-web.sh -k <url> 1:00:00 1:00:20 teahupoo
#
# OPTIONS (optional: the positional form covers the common cases)
#   -u <url>     YouTube (or any yt-dlp supported) URL to download from.
#   -s <time>    Section start,  hh:mm:ss  (requires -u).
#   -e <time>    Section end,    hh:mm:ss  (requires -u).
#   -i <file>    Use an existing local file instead of downloading.
#   -k           Keep the downloaded master file (default: deleted after encode).
#   -h           Show this help.
#
# NOTE ON TIMES: yt-dlp parses hh:mm:ss, so 10:11:59 means 10h11m59s. Make sure
# the range is inside the video's duration or you get an empty clip.
#
# OUTPUT
#   src/assets/videos/<name>.mp4             1920x1080 H.264, muted, faststart  -> desktopVideo
#   src/assets/videos/<name>_instagram.mp4   1080x1920 H.264, muted, faststart  -> mobileVideo
#   src/assets/videos/<name>.webm            1920x1080 VP9 (optional <source>)
#   src/assets/images/stage/<name>.jpg       poster frame
#
# The stage <video> is muted/autoplay, so audio is stripped (-an): it saves
# bandwidth and removes any chance of an autoplay block due to sound.
set -euo pipefail

# Resolve paths from the script location, not the current working directory.
# This file lives in <repo>/build/youtube/, so the repo root is two levels up.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

URL=""
START=""
END=""
SRC=""
KEEP_MASTER=0

usage() {
  awk 'NR > 2 && /^#/ { sub(/^# ?/, ""); print; next } NR > 2 { exit }' "$0"
  exit "${1:-0}"
}

while getopts ":u:s:e:i:kh" opt; do
  case "$opt" in
    u) URL="$OPTARG" ;;
    s) START="$OPTARG" ;;
    e) END="$OPTARG" ;;
    i) SRC="$OPTARG" ;;
    k) KEEP_MASTER=1 ;;
    h) usage 0 ;;
    \?) echo "Unknown option: -$OPTARG" >&2; usage 1 ;;
    :)  echo "Option -$OPTARG requires an argument." >&2; usage 1 ;;
  esac
done
shift $((OPTIND - 1))

# --- Positional form --------------------------------------------------------
# <url|file> <start> <end> <name>   or   <file> <name>
# Anything already given with -u/-i/-s/-e wins, so both styles can be mixed.
if [ "$#" -eq 4 ]; then
  if [ -z "$URL" ] && [ -z "$SRC" ]; then
    if [ -f "$1" ]; then SRC="$1"; else URL="$1"; fi
  fi
  [ -n "$START" ] || START="$2"
  [ -n "$END" ]   || END="$3"
  set -- "$4"
elif [ "$#" -eq 3 ]; then
  # <start> <end> <name> together with -u/-i
  [ -n "$START" ] || START="$1"
  [ -n "$END" ]   || END="$2"
  set -- "$3"
elif [ "$#" -eq 2 ]; then
  # <file> <name>
  if [ -z "$URL" ] && [ -z "$SRC" ]; then SRC="$1"; fi
  set -- "$2"
fi

NAME="${1:-}"
[ -n "$NAME" ] || { echo "Error: missing <name>." >&2; usage 1; }

OUT_VIDEO="$ROOT_DIR/src/assets/videos"
OUT_POSTER="$ROOT_DIR/src/assets/images/stage"
mkdir -p "$OUT_VIDEO" "$OUT_POSTER"

# --- 1. Get the master clip -------------------------------------------------
DOWNLOADED=0
if [ -n "$URL" ]; then
  [ -n "$START" ] && [ -n "$END" ] || {
    echo "Error: -u also requires -s <start> and -e <end>." >&2; exit 1; }

  DURATION="$(yt-dlp --no-warnings --print "%(duration_string)s" "$URL" | tail -1)"
  echo "==> Source duration: ${DURATION}. Requested section: ${START} -> ${END}"

  SRC="$SCRIPT_DIR/${NAME}_master.mp4"
  rm -f "$SRC"
  yt-dlp \
    --extractor-args "youtube:player_client=default,tv" \
    --download-sections "*${START}-${END}" \
    --force-keyframes-at-cuts \
    -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" \
    --merge-output-format mp4 \
    -o "$SRC" "$URL"

  [ -s "$SRC" ] || {
    echo "Error: download produced no data. Is ${START}-${END} inside ${DURATION}?" >&2
    exit 1; }
  DOWNLOADED=1
fi

[ -n "$SRC" ] || { echo "Error: provide -u <url> or -i <file>." >&2; usage 1; }
[ -f "$SRC" ] || { echo "Error: source file not found: $SRC" >&2; exit 1; }

echo "==> Encoding from: $SRC"

# --- 2. Desktop: 1920x1080, cover-cropped, 30fps ---------------------------
ffmpeg -y -i "$SRC" \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" \
  -c:v libx264 -profile:v high -level 4.0 -preset slow \
  -crf 24 -maxrate 3M -bufsize 6M \
  -pix_fmt yuv420p -g 60 -an -movflags +faststart \
  "$OUT_VIDEO/${NAME}.mp4"

# --- 3. Mobile: 1080x1920 vertical -----------------------------------------
ffmpeg -y -i "$SRC" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -c:v libx264 -profile:v high -level 4.0 -preset slow \
  -crf 26 -maxrate 2500k -bufsize 5M \
  -pix_fmt yuv420p -g 60 -an -movflags +faststart \
  "$OUT_VIDEO/${NAME}_instagram.mp4"

# --- 4. Optional VP9/WebM alternative --------------------------------------
ffmpeg -y -i "$SRC" \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" \
  -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  -pix_fmt yuv420p -an \
  "$OUT_VIDEO/${NAME}.webm"

# --- 5. Poster frame (1s in, avoids black intro frames) --------------------
ffmpeg -y -ss 1 -i "$SRC" -frames:v 1 -update 1 \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
  -q:v 4 "$OUT_POSTER/${NAME}.jpg"

# --- 6. Clean up the heavy master unless -k --------------------------------
if [ "$DOWNLOADED" -eq 1 ] && [ "$KEEP_MASTER" -eq 0 ]; then
  rm -f "$SRC"
fi

echo
echo "==> Done:"
ls -lh "$OUT_VIDEO/${NAME}"* "$OUT_POSTER/${NAME}.jpg"
echo
echo "Add to DEFAULT_STAGE_VIDEOS in src/app/models/stagevideo.ts:"
echo "  desktopVideo: 'assets/videos/${NAME}.mp4'"
echo "  mobileVideo:  'assets/videos/${NAME}_instagram.mp4'"
echo "  thumbnail:    'assets/images/stage/${NAME}.jpg'"
