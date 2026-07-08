#!/usr/bin/env bash
# Install mvp-scaffold Railway setup deps and run setup_project.py from a cloned fork.
set -euo pipefail

REPO_DIR=""
PROJECT_ID=""
TOKEN=""
REPO=""
DRY_RUN=false
SKIP_STAGING=false

usage() {
  cat <<'EOF'
Usage: run_railway_setup.sh --repo-dir PATH --project-id ID --token TOKEN [options]

Options:
  --repo-dir PATH     Root of cloned fork (required)
  --project-id ID     Railway project ID (required)
  --token TOKEN       Railway API token (required)
  --repo OWNER/NAME   GitHub repo override (default: git remote origin)
  --dry-run           Preview changes without mutating Railway
  --skip-staging      Skip staging environment setup
  -h, --help          Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-dir) REPO_DIR="$2"; shift 2 ;;
    --project-id) PROJECT_ID="$2"; shift 2 ;;
    --token) TOKEN="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --skip-staging) SKIP_STAGING=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REPO_DIR" || -z "$PROJECT_ID" || -z "$TOKEN" ]]; then
  echo "Error: --repo-dir, --project-id, and --token are required." >&2
  usage
  exit 1
fi

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "Error: ${REPO_DIR} is not a git repository." >&2
  exit 1
fi

if [[ ! -f "$REPO_DIR/pyproject.toml" ]]; then
  echo "Error: ${REPO_DIR}/pyproject.toml not found — is this an mvp-scaffold fork?" >&2
  exit 1
fi

if [[ ! -f "$REPO_DIR/scripts/railway/setup_project.py" ]]; then
  echo "Error: setup script not found at scripts/railway/setup_project.py" >&2
  exit 1
fi

cd "$REPO_DIR"

ORIGIN_REPO="$(git remote get-url origin 2>/dev/null || true)"
if echo "$ORIGIN_REPO" | grep -qi 'Larza-Intelligence-Inc/mvp-scaffold'; then
  echo "Error: This looks like the template repo. Run from your fork." >&2
  exit 1
fi

echo "==> Setting up Python environment in ${REPO_DIR}/.venv"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -e .

export RAILWAY_API_TOKEN="$TOKEN"
export PROJECT_ID="$PROJECT_ID"

ARGS=()
[[ -n "$REPO" ]] && ARGS+=(--repo "$REPO")
[[ "$DRY_RUN" == true ]] && ARGS+=(--dry-run)
[[ "$SKIP_STAGING" == true ]] && ARGS+=(--skip-staging)

echo "==> Running railway setup (dry_run=${DRY_RUN}, skip_staging=${SKIP_STAGING})"
python scripts/railway/setup_project.py "${ARGS[@]}"

echo ""
echo "==> Setup complete"
