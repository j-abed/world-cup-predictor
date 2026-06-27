#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
PROJECT_JSON="$FRONTEND_DIR/.vercel/project.json"
TOKEN_NAME="${VERCEL_TOKEN_NAME:-world-cup-predictor-github-actions}"

DRY_RUN=false
LINK_PROJECT=false
TRIGGER_DEPLOY=false
VERCEL_TOKEN_INPUT=""

usage() {
  cat <<'EOF'
Configure GitHub Actions secrets for .github/workflows/deploy-frontend.yml.

Reads VERCEL_ORG_ID and VERCEL_PROJECT_ID from frontend/.vercel/project.json.
Creates or accepts a Vercel token, then runs `gh secret set` for all three secrets.

Usage:
  ./scripts/setup_github_vercel_secrets.sh [options]

Options:
  --dry-run           Print values that would be set (token redacted)
  --link              Run `vercel link` in frontend/ if project.json is missing
  --vercel-token STR  Use this token instead of creating one
  --trigger-deploy    Run `gh workflow run deploy-frontend.yml` after secrets are set
  -h, --help          Show this help

Environment:
  VERCEL_TOKEN        Use an existing classic token (skips creation)
  VERCEL_TOKEN_NAME   Name for a newly created token (default: world-cup-predictor-github-actions)

Prerequisites:
  - `vercel login` (for linking and optional token creation)
  - `gh auth login` with permission to manage repository secrets
  - `frontend/.vercel/project.json` (from `cd frontend && vercel link`, or pass --link)

Token notes:
  OAuth sessions from `vercel login` cannot create new tokens via the CLI.
  If auto-creation fails, create a classic token at https://vercel.com/account/tokens
  and re-run with VERCEL_TOKEN=<token> or --vercel-token <token>.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --link)
      LINK_PROJECT=true
      shift
      ;;
    --vercel-token)
      VERCEL_TOKEN_INPUT="${2:-}"
      if [[ -z "$VERCEL_TOKEN_INPUT" ]]; then
        echo "error: --vercel-token requires a value" >&2
        exit 1
      fi
      shift 2
      ;;
    --trigger-deploy)
      TRIGGER_DEPLOY=true
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

read_project_ids() {
  python3 - "$PROJECT_JSON" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text())
for key in ("orgId", "projectId"):
    value = data.get(key)
    if not value:
        raise SystemExit(f"error: missing {key} in {path}")
    print(value)
PY
}

extract_bearer_token() {
  python3 - "$1" <<'PY'
import json
import sys

raw = sys.argv[1].strip()
if not raw:
    raise SystemExit("empty token response")

try:
    payload = json.loads(raw)
except json.JSONDecodeError as exc:
    raise SystemExit(f"expected JSON from vercel tokens add: {exc}") from exc

token = payload.get("bearerToken")
if not token:
    raise SystemExit("vercel tokens add response did not include bearerToken")
print(token)
PY
}

prompt_for_token() {
  cat <<'EOF'

Could not create a Vercel token automatically.
Create a classic token at https://vercel.com/account/tokens
then paste it below (input is hidden).
EOF
  read -rsp "VERCEL_TOKEN: " VERCEL_TOKEN_INPUT
  echo
  if [[ -z "$VERCEL_TOKEN_INPUT" ]]; then
    echo "error: no token provided" >&2
    exit 1
  fi
}

create_vercel_token() {
  local output
  local status=0

  set +e
  output="$(
    vercel tokens add "$TOKEN_NAME" --format json --project "$PROJECT_ID" 2>&1
  )"
  status=$?
  set -e

  if [[ "$status" -ne 0 ]]; then
    if [[ "$output" == *"classic personal access token"* ]] \
      || [[ "$output" == *"OAuth login cannot"* ]] \
      || [[ "$output" == *"Only user authentication tokens can be used"* ]]; then
      echo "note: Vercel OAuth login cannot mint new tokens via the CLI." >&2
      return 1
    fi

    echo "$output" >&2
    return "$status"
  fi

  extract_bearer_token "$output"
}

require_command vercel
require_command gh
require_command python3

if ! vercel whoami >/dev/null 2>&1; then
  echo "error: not logged in to Vercel. Run: vercel login" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: not logged in to GitHub CLI. Run: gh auth login" >&2
  exit 1
fi

if [[ ! -f "$PROJECT_JSON" ]]; then
  if [[ "$LINK_PROJECT" == true ]]; then
    echo "=== Linking frontend/ to Vercel ==="
    (cd "$FRONTEND_DIR" && vercel link)
  else
    echo "error: missing $PROJECT_JSON" >&2
    echo "Run: cd frontend && vercel link" >&2
    echo "Or re-run with --link" >&2
    exit 1
  fi
fi

PROJECT_VALUES=()
while IFS= read -r line; do
  PROJECT_VALUES+=("$line")
done < <(read_project_ids)
ORG_ID="${PROJECT_VALUES[0]}"
PROJECT_ID="${PROJECT_VALUES[1]}"

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo "Repository: $REPO"
echo "Vercel org:   $ORG_ID"
echo "Vercel proj:  $PROJECT_ID"

if [[ -n "${VERCEL_TOKEN_INPUT:-}" ]]; then
  VERCEL_TOKEN="$VERCEL_TOKEN_INPUT"
elif [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL_TOKEN="$VERCEL_TOKEN"
else
  echo ""
  echo "=== Creating Vercel token ($TOKEN_NAME) ==="
  if ! VERCEL_TOKEN="$(create_vercel_token)"; then
    prompt_for_token
    VERCEL_TOKEN="$VERCEL_TOKEN_INPUT"
  fi
fi

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo "Dry run — would set GitHub secrets on $REPO:"
  echo "  VERCEL_ORG_ID=$ORG_ID"
  echo "  VERCEL_PROJECT_ID=$PROJECT_ID"
  echo "  VERCEL_TOKEN=*** (${#VERCEL_TOKEN} chars)"
  exit 0
fi

echo ""
echo "=== Setting GitHub secrets ==="
gh secret set VERCEL_ORG_ID --body "$ORG_ID" --repo "$REPO"
gh secret set VERCEL_PROJECT_ID --body "$PROJECT_ID" --repo "$REPO"
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN" --repo "$REPO"

echo ""
echo "Secrets configured on $REPO:"
gh secret list --repo "$REPO" | grep '^VERCEL_' || true

if [[ "$TRIGGER_DEPLOY" == true ]]; then
  echo ""
  echo "=== Triggering deploy-frontend workflow ==="
  gh workflow run deploy-frontend.yml --repo "$REPO"
  echo "Watch progress with: gh run watch --repo $REPO"
fi

echo ""
echo "Done."
