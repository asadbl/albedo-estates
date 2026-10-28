#!/usr/bin/env bash
# Contact sheet of a clip so you can look for cuts, crossfades and wrong motion: sheet.sh <clip> <out.jpg> [fps] [cols]
set -euo pipefail
FPS="${3:-2}"; COLS="${4:-4}"
ffmpeg -v error -y -i "$1" -vf "fps=$FPS,scale=400:-2,tile=${COLS}x4" -frames:v 1 "$2"
echo "$2"
