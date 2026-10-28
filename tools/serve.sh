#!/usr/bin/env bash
# Start the dev server on the first free port from 5180 and print the URLs: serve.sh <site-dir>
set -euo pipefail
cd "$1"
PORT=5180
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
nohup npx vite --host --port $PORT --strictPort > .vite.log 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$PORT/" && break; sleep 0.25; done
echo "local:   http://localhost:$PORT/"
IP=$(ipconfig getifaddr en0 2>/dev/null || true); [ -n "$IP" ] && echo "network: http://$IP:$PORT/"
