#!/usr/bin/env bash
set -euo pipefail

TOURNAMENT_START="2026-06-11"
TODAY="$(date +%Y-%m-%d)"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Syncing results, ratings, and fair-play data ($TOURNAMENT_START → $TODAY) ==="
uv run python scripts/update_world_cup_data.py \
  --start-date "$TOURNAMENT_START" \
  --end-date "$TODAY" \
  --force \
  --update-ratings \
  --update-fair-play \
  --run-model \
  --export-web

echo ""
echo "=== Copying app state to frontend ==="
cp "$ROOT_DIR/outputs/web/app_state.json" "$ROOT_DIR/frontend/public/data/app_state.json"

echo ""
echo "=== Deploying to Vercel ==="
cd "$ROOT_DIR/frontend"
vercel deploy --prod

echo ""
echo "Done."
