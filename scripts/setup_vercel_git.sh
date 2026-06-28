#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
PROJECT_JSON="$FRONTEND_DIR/.vercel/project.json"
ROOT_DIRECTORY="${VERCEL_ROOT_DIRECTORY:-frontend}"
PRODUCTION_BRANCH="${VERCEL_PRODUCTION_BRANCH:-main}"

DRY_RUN=false
LINK_PROJECT=false
SKIP_GIT_CONNECT=false
SKIP_PROJECT_PATCH=false
TRIGGER_PREVIEW=false
VERCEL_TOKEN_INPUT=""

usage() {
  cat <<EOF
Link this repository to Vercel for automatic preview deployments on branches/PRs.

Configures the linked Vercel project for monorepo builds (root directory: frontend),
applies build settings from frontend/vercel.json, and connects GitHub via \`vercel git connect\`.

Usage:
  ./scripts/setup_vercel_git.sh [options]

Options:
  --dry-run              Print planned changes without calling the Vercel API
  --link                 Run \`vercel link\` in frontend/ if project.json is missing
  --skip-git-connect     Only patch project settings; skip \`vercel git connect\`
  --skip-project-patch   Only run \`vercel git connect\`
  --trigger-preview      Push an empty commit to the current branch after setup
  -h, --help             Show this help

Environment:
  VERCEL_TOKEN           Classic token for Vercel REST API (required for project patch)
  VERCEL_ROOT_DIRECTORY  Monorepo app path (default: frontend)
  VERCEL_PRODUCTION_BRANCH  Production branch name (default: main)

Prerequisites:
  - \`vercel login\`
  - \`gh auth login\`
  - \`frontend/.vercel/project.json\` (from \`cd frontend && vercel link\`, or pass --link)
  - GitHub App: first-time connect may require approving Vercel in GitHub → Settings → Applications

Production deploy note:
  This repo also deploys production via .github/workflows/deploy-frontend.yml on push to main.
  After linking Git, Vercel may deploy main too. Prefer one prod path:
    - Vercel Git only: disable the deploy job in deploy-frontend.yml
    - GitHub Actions only: keep GHA; previews still work from Vercel Git on other branches

See also: ./scripts/setup_github_vercel_secrets.sh for GHA deploy secrets.
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
    --skip-git-connect)
      SKIP_GIT_CONNECT=true
      shift
      ;;
    --skip-project-patch)
      SKIP_PROJECT_PATCH=true
      shift
      ;;
    --trigger-preview)
      TRIGGER_PREVIEW=true
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
for key in ("orgId", "projectId", "projectName"):
    value = data.get(key)
    if key == "projectName" and not value:
        value = "frontend"
    if key != "projectName" and not value:
        raise SystemExit(f"error: missing {key} in {path}")
    print(value)
PY
}

prompt_for_token() {
  cat <<'EOF'

A Vercel classic token is required to update project settings via the REST API.
Create one at https://vercel.com/account/tokens
then paste it below (input is hidden), or re-run with VERCEL_TOKEN=<token>.
EOF
  read -rsp "VERCEL_TOKEN: " VERCEL_TOKEN_INPUT
  echo
  if [[ -z "$VERCEL_TOKEN_INPUT" ]]; then
    echo "error: no token provided" >&2
    exit 1
  fi
}

resolve_vercel_token() {
  if [[ -n "${VERCEL_TOKEN_INPUT:-}" ]]; then
    VERCEL_TOKEN="$VERCEL_TOKEN_INPUT"
  elif [[ -n "${VERCEL_TOKEN:-}" ]]; then
    VERCEL_TOKEN="$VERCEL_TOKEN"
  else
    prompt_for_token
    VERCEL_TOKEN="$VERCEL_TOKEN_INPUT"
  fi
}

patch_project_settings() {
  local payload
  payload="$(
    python3 - "$ROOT_DIRECTORY" <<'PY'
import json
import sys

root_directory = sys.argv[1]
print(json.dumps({
    "rootDirectory": root_directory,
    "framework": "vite",
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "installCommand": "npm ci",
}))
PY
  )"

  if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "Dry run — would PATCH /v9/projects/$PROJECT_ID?teamId=$ORG_ID"
    echo "$payload" | python3 -m json.tool
    return 0
  fi

  local response
  local http_code
  response="$(
    curl -sS -w "\n%{http_code}" -X PATCH \
      "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${ORG_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$payload"
  )"
  http_code="${response##*$'\n'}"
  response="${response%$'\n'*}"

  if [[ "$http_code" != "200" ]]; then
    echo "error: Vercel project patch failed (HTTP $http_code)" >&2
    echo "$response" >&2
    exit 1
  fi

  echo "Updated Vercel project settings (rootDirectory=$ROOT_DIRECTORY)."
}

connect_git_repository() {
  local git_url="$1"

  if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "Dry run — would run in frontend/: vercel git connect $git_url"
    return 0
  fi

  echo ""
  echo "=== Connecting Git repository ==="
  if ! (cd "$FRONTEND_DIR" && vercel git connect "$git_url"); then
    cat <<EOF >&2

Git connect did not complete successfully.
If this is the first link, approve the Vercel GitHub App for this repo:
  GitHub → Settings → Applications → Vercel → Configure → select this repository

Then re-run:
  ./scripts/setup_vercel_git.sh --skip-project-patch
EOF
    exit 1
  fi
}

trigger_preview_push() {
  local branch
  branch="$(git -C "$ROOT_DIR" branch --show-current)"

  if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "Dry run — would push empty commit to origin/$branch to trigger preview build."
    return 0
  fi

  echo ""
  echo "=== Triggering preview build (empty commit on $branch) ==="
  git -C "$ROOT_DIR" commit --allow-empty -m "chore: trigger Vercel preview after Git link"
  git -C "$ROOT_DIR" push origin "HEAD:$branch"
  echo "Push complete. Check the PR or Vercel dashboard for the preview URL."
}

require_command vercel
require_command gh
require_command python3
require_command curl
require_command git

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
    (cd "$FRONTEND_DIR" && vercel link --yes)
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
PROJECT_NAME="${PROJECT_VALUES[2]}"

REPO="$(gh repo view --json nameWithOwner,url --jq .nameWithOwner)"
GIT_URL="$(gh repo view --json url --jq .url).git"

echo "Repository:     $REPO"
echo "Git remote:     $GIT_URL"
echo "Vercel team:    $ORG_ID"
echo "Vercel project: $PROJECT_NAME ($PROJECT_ID)"
echo "Root directory: $ROOT_DIRECTORY"
echo "Production:     $PRODUCTION_BRANCH"

if [[ "$SKIP_PROJECT_PATCH" != true ]]; then
  if [[ "$DRY_RUN" != true ]]; then
    resolve_vercel_token
  fi
  echo ""
  echo "=== Patching Vercel project settings ==="
  patch_project_settings
fi

if [[ "$SKIP_GIT_CONNECT" != true ]]; then
  connect_git_repository "$GIT_URL"
fi

if [[ "$TRIGGER_PREVIEW" == true ]]; then
  trigger_preview_push
fi

echo ""
cat <<EOF
Done.

Next steps:
  1. Open a PR or push to a feature branch — Vercel should comment with a preview URL.
  2. Dashboard: https://vercel.com/$(vercel whoami 2>/dev/null || echo "<team>")/$PROJECT_NAME/settings/git
  3. If main deploys twice (Vercel + GitHub Actions), pick one production path (see --help).

EOF
