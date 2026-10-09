#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if curl -sf --max-time 2 http://127.0.0.1:8080/ | grep -q "<title>Games</title>"; then
  echo "Afterburner is already running on http://localhost:8080"
  exit 0
fi

setsid nohup pnpm start >> /tmp/afterburner.log 2>&1 < /dev/null &

for _ in $(seq 1 40); do
  if curl -sf --max-time 2 http://127.0.0.1:8080/ | grep -q "<title>Games</title>"; then
    echo "Afterburner listening on http://localhost:8080"
    exit 0
  fi
  sleep 0.5
done

echo "Afterburner did not start. Log:"
cat /tmp/afterburner.log
exit 1
