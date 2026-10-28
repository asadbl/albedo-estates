#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch of origin: tools/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
URL="$(git remote get-url origin)"
npx vite build
touch dist/.nojekyll
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -qm "Deploy $(git -C .. rev-parse --short HEAD)"
git push -f -q "$URL" gh-pages
rm -rf .git
echo "deployed to gh-pages"
