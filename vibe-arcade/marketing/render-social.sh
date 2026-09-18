#!/usr/bin/env bash
set -euo pipefail

# LoopJolt deterministic social-video finishing layer.
# AI video generators are NOT trusted to render brand text correctly.
# Usage:
#   ./render-social.sh input.mp4 output.mp4 "HOOK TITLE" "SHORT SUBTITLE" "PLAY FREE · @playloopjolt"
#
# The source generation prompt should contain NO visible text, logos, usernames, URLs,
# or score numerals that must be exact. All exact copy is added here.

IN="${1:?input mp4 required}"
OUT="${2:?output mp4 required}"
TITLE="${3:-CAN YOU BEAT THIS?}"
SUBTITLE="${4:-Tiny browser game. No install.}"
CTA="${5:-PLAY FREE · @playloopjolt}"

FONT_BOLD="/usr/share/fonts/truetype/montserrat/Montserrat-Bold.ttf"
FONT_REG="/usr/share/fonts/truetype/montserrat/Montserrat-SemiBold.ttf"

ffmpeg -y -i "$IN"   -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawbox=x=0:y=0:w=iw:h=205:color=black@0.68:t=fill,drawtext=fontfile=$FONT_BOLD:text='${TITLE//:/\:}':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=44,drawtext=fontfile=$FONT_REG:text='${SUBTITLE//:/\:}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=126,drawbox=x=0:y=h-165:w=iw:h=165:color=black@0.65:t=fill,drawtext=fontfile=$FONT_BOLD:text='${CTA//:/\:}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=h-112,drawtext=fontfile=$FONT_BOLD:text='LOOPJOLT':fontcolor=white@0.72:fontsize=24:x=w-text_w-34:y=230"   -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p   -c:a aac -b:a 128k -movflags +faststart "$OUT"
