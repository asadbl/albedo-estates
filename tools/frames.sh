#!/usr/bin/env bash
# First and last frame of a clip, full quality, for chaining the next shot: frames.sh <clip> <prefix>
set -euo pipefail
ffmpeg -v error -y -i "$1" -frames:v 1 -q:v 1 "$2-first.jpg"
ffmpeg -v error -y -sseof -0.05 -i "$1" -frames:v 1 -q:v 1 "$2-last.jpg"
echo "$2-first.jpg $2-last.jpg"
