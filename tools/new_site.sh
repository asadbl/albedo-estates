#!/usr/bin/env bash
# Scaffold a cinematic scroll site from this template: new_site.sh <target-dir>
set -euo pipefail
TPL="$(cd "$(dirname "$0")/.." && pwd)"
DST="$1"
mkdir -p "$DST"
if [ -e "$DST/package.json" ]; then echo "refusing: $DST already has a package.json" >&2; exit 1; fi
cp -R "$TPL/index.html" "$TPL/package.json" "$TPL/.gitignore" "$TPL/src" "$TPL/tools" "$DST/"
mkdir -p "$DST/public/frames" "$DST/scenes" "$DST/source"
cd "$DST"
npm i -D vite@latest >/dev/null 2>&1
npm i lenis >/dev/null 2>&1
echo "scaffolded $DST"
