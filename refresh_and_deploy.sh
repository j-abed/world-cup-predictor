#!/usr/bin/env bash
set -euo pipefail

TOURNAMENT_START="2026-06-11"
TODAY="$(date +%Y-%m-%d)"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Syncing results from ESPN ($TOURNAMENT_START → $TODAY) ==="
uv run python scripts/sync_results_from_espn.py \
  --start-date "$TOURNAMENT_START" \
  --end-date "$TODAY"

echo ""
echo "=== Running simulator ==="
uv run python main.py

echo ""
echo "=== Exporting web state ==="
uv run python scripts/export_web_state.py

echo ""
echo "=== Copying app state to frontend ==="
cp outputs/web/app_state.json frontend/public/data/app_state.json

echo ""
echo "=== Deploying to Vercel ==="
cd "$ROOT_DIR/frontend"
vercel deploy --prod

echo ""
echo "Done."
