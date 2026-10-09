#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  echo "Afterburner is already listening on http://localhost:8080"
  exit 0
fi

nohup pnpm start >> /tmp/afterburner.log 2>&1 &
echo "Afterburner starting on http://localhost:8080"
echo "Logs: /tmp/afterburner.log"
