#!/usr/bin/env bash
# PUT a local file to a Higgsfield presigned upload_url (from media_upload), print the HTTP code: put.sh <file> <url>
set -euo pipefail
case "$1" in *.png) CT=image/png;; *.mp4) CT=video/mp4;; *) CT=image/jpeg;; esac
curl -s -o /dev/null -w "%{http_code}\n" -X PUT -H "Content-Type: $CT" -H "If-None-Match: *" --data-binary @"$1" "$2"
