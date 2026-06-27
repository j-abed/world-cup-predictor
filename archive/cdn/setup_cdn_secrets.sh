#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
SKIP_VERCEL=false
TRIGGER_REFRESH=false

S3_URI=""
ACCESS_KEY=""
SECRET_KEY=""
AWS_REGION=""
ENDPOINT_URL=""
ODDS_API_KEY=""

usage() {
  cat <<'EOF'
Configure GitHub Actions secrets for CDN data publish and optional market odds.

Sets repository secrets used when the CDN publish step is enabled in refresh-data.yml:
  - WEB_DATA_S3_URI
  - WEB_DATA_ACCESS_KEY_ID
  - WEB_DATA_SECRET_ACCESS_KEY
  - WEB_DATA_AWS_REGION
  - WEB_DATA_AWS_ENDPOINT_URL (optional, for R2)
  - ODDS_API_KEY (optional, for live outright odds)

Also prints the Vercel env var to point the frontend at the CDN snapshot.

Usage:
  ./archive/cdn/setup_cdn_secrets.sh [options]

Options:
  --s3-uri URI              s3://bucket/prefix or r2:// style destination
  --access-key KEY          AWS/R2 access key id
  --secret-key KEY          AWS/R2 secret access key
  --region REGION           AWS region (e.g. auto for R2, us-east-1 for S3)
  --endpoint-url URL        Custom endpoint (Cloudflare R2)
  --odds-api-key KEY        The Odds API key (optional)
  --dry-run                 Print values that would be set (secrets redacted)
  --skip-vercel             Do not print Vercel setup instructions
  --trigger-refresh         Run `gh workflow run refresh-data.yml` after secrets are set
  -h, --help                Show this help

See archive/cdn/README.md for re-enabling CDN publish in CI.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --s3-uri)
      S3_URI="${2:-}"
      shift 2
      ;;
    --access-key)
      ACCESS_KEY="${2:-}"
      shift 2
      ;;
    --secret-key)
      SECRET_KEY="${2:-}"
      shift 2
      ;;
    --region)
      AWS_REGION="${2:-}"
      shift 2
      ;;
    --endpoint-url)
      ENDPOINT_URL="${2:-}"
      shift 2
      ;;
    --odds-api-key)
      ODDS_API_KEY="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-vercel)
      SKIP_VERCEL=true
      shift
      ;;
    --trigger-refresh)
      TRIGGER_REFRESH=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command not found: $1" >&2
    exit 1
  fi
}

prompt_if_empty() {
  local var_name="$1"
  local prompt_text="$2"
  local current_value="${!var_name:-}"

  if [[ -n "$current_value" ]]; then
    return
  fi

  read -rp "$prompt_text: " current_value

  if [[ -z "$current_value" ]]; then
    echo "error: $var_name is required" >&2
    exit 1
  fi

  printf -v "$var_name" '%s' "$current_value"
}

require_command gh

if ! gh auth status >/dev/null 2>&1; then
  echo "error: not logged in to GitHub CLI. Run: gh auth login" >&2
  exit 1
fi

S3_URI="${S3_URI:-${WEB_DATA_S3_URI:-}}"
ACCESS_KEY="${ACCESS_KEY:-${WEB_DATA_ACCESS_KEY_ID:-}}"
SECRET_KEY="${SECRET_KEY:-${WEB_DATA_SECRET_ACCESS_KEY:-}}"
AWS_REGION="${AWS_REGION:-${WEB_DATA_AWS_REGION:-}}"
ENDPOINT_URL="${ENDPOINT_URL:-${WEB_DATA_AWS_ENDPOINT_URL:-}}"
ODDS_API_KEY="${ODDS_API_KEY:-${ODDS_API_KEY:-}}"

prompt_if_empty S3_URI "WEB_DATA_S3_URI (e.g. s3://my-bucket/world-cup-predictor)"
prompt_if_empty ACCESS_KEY "WEB_DATA_ACCESS_KEY_ID"
prompt_if_empty SECRET_KEY "WEB_DATA_SECRET_ACCESS_KEY"
prompt_if_empty AWS_REGION "WEB_DATA_AWS_REGION (use auto for Cloudflare R2)"

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo "Repository: $REPO"
echo "CDN origin: $S3_URI"

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo "Dry run — would set GitHub secrets on $REPO:"
  echo "  WEB_DATA_S3_URI=$S3_URI"
  echo "  WEB_DATA_ACCESS_KEY_ID=$ACCESS_KEY"
  echo "  WEB_DATA_SECRET_ACCESS_KEY=***"
  echo "  WEB_DATA_AWS_REGION=$AWS_REGION"
  if [[ -n "$ENDPOINT_URL" ]]; then
    echo "  WEB_DATA_AWS_ENDPOINT_URL=$ENDPOINT_URL"
  fi
  if [[ -n "$ODDS_API_KEY" ]]; then
    echo "  ODDS_API_KEY=*** (${#ODDS_API_KEY} chars)"
  fi
  exit 0
fi

echo ""
echo "=== Setting GitHub secrets ==="
gh secret set WEB_DATA_S3_URI --body "$S3_URI" --repo "$REPO"
gh secret set WEB_DATA_ACCESS_KEY_ID --body "$ACCESS_KEY" --repo "$REPO"
gh secret set WEB_DATA_SECRET_ACCESS_KEY --body "$SECRET_KEY" --repo "$REPO"
gh secret set WEB_DATA_AWS_REGION --body "$AWS_REGION" --repo "$REPO"

if [[ -n "$ENDPOINT_URL" ]]; then
  gh secret set WEB_DATA_AWS_ENDPOINT_URL --body "$ENDPOINT_URL" --repo "$REPO"
fi

if [[ -n "$ODDS_API_KEY" ]]; then
  gh secret set ODDS_API_KEY --body "$ODDS_API_KEY" --repo "$REPO"
fi

echo ""
echo "Secrets configured on $REPO:"
gh secret list --repo "$REPO" | grep -E '^(WEB_DATA_|ODDS_API_KEY)' || true

if [[ "$SKIP_VERCEL" != true ]]; then
  echo ""
  echo "=== Vercel frontend env (manual) ==="
  echo "Set this in the Vercel project so data refreshes skip full redeploys:"
  echo "  VITE_APP_STATE_URL=https://<your-public-cdn-host>/app_state.json"
  echo ""
  echo "Re-enable the CDN step in refresh-data.yml — see archive/cdn/README.md."
fi

if [[ "$TRIGGER_REFRESH" == true ]]; then
  echo ""
  echo "=== Triggering refresh-data workflow ==="
  gh workflow run refresh-data.yml --repo "$REPO"
  echo "Watch progress with: gh run watch --repo $REPO"
fi

echo ""
echo "Done."
