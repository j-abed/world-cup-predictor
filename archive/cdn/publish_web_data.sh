#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE="${1:-$ROOT_DIR/outputs/web/app_state.json}"

if [[ ! -f "$SOURCE" ]]; then
  echo "Source file not found: $SOURCE" >&2
  exit 1
fi

if [[ -z "${WEB_DATA_S3_URI:-}" ]]; then
  echo "WEB_DATA_S3_URI is not set; skipping CDN publish."
  echo "Example: WEB_DATA_S3_URI=s3://my-bucket/world-cup-predictor"
  exit 0
fi

DEST="${WEB_DATA_S3_URI%/}/app_state.json"

echo "Publishing $SOURCE to $DEST"

AWS_ARGS=()

if [[ -n "${AWS_ENDPOINT_URL:-}" ]]; then
  AWS_ARGS+=(--endpoint-url "$AWS_ENDPOINT_URL")
fi

aws s3 cp "$SOURCE" "$DEST" \
  --content-type "application/json; charset=utf-8" \
  --cache-control "public, max-age=120" \
  "${AWS_ARGS[@]}"

echo "Published app_state.json to CDN origin."
