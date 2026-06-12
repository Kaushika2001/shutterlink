#!/usr/bin/env bash
# Run on the VPS from backend/: bash scripts/deploy-vps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> ShutterLink backend deploy ($ROOT)"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example and fill in production values."
  exit 1
fi

mkdir -p logs

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "==> git pull"
  git pull --ff-only || true
fi

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

echo "==> npm run check:env"
npm run check:env

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe shutterlink-api >/dev/null 2>&1; then
    echo "==> pm2 restart shutterlink-api"
    pm2 restart shutterlink-api
  else
    echo "==> pm2 start"
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
else
  echo "PM2 not installed — start manually: npm start"
fi

echo "==> Health check"
sleep 2
curl -sf "http://127.0.0.1:${PORT:-5000}/api/health" >/dev/null && echo "OK" || echo "WARN: health check failed"

echo "==> Done"
