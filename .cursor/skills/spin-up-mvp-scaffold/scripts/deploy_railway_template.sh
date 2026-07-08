#!/usr/bin/env bash
# Create a Railway project and deploy the mvp-scaffold template via CLI.
set -euo pipefail

PROJECT_NAME=""
WORKSPACE="Larza"
TEMPLATE="mvp-scaffold"
WORK_DIR=""

usage() {
  cat <<'EOF'
Usage: deploy_railway_template.sh --name PROJECT_NAME [options]

Options:
  --name NAME         Railway project name (required; usually matches repo name)
  --workspace NAME    Railway workspace name or ID (default: Larza)
  --template CODE     Template code to deploy (default: mvp-scaffold)
  --work-dir PATH     Directory for railway init/link (default: /tmp/railway-deploy-NAME)
  -h, --help          Show this help

Prints PROJECT_ID on success for use in run_railway_setup.sh.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) PROJECT_NAME="$2"; shift 2 ;;
    --workspace) WORKSPACE="$2"; shift 2 ;;
    --template) TEMPLATE="$2"; shift 2 ;;
    --work-dir) WORK_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: --name is required." >&2
  usage
  exit 1
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "Error: Railway CLI is not installed. See https://docs.railway.com/guides/cli" >&2
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Error: Railway CLI is not authenticated. Run: railway login" >&2
  exit 1
fi

WORK_DIR="${WORK_DIR:-/tmp/railway-deploy-${PROJECT_NAME}}"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "==> Creating Railway project '${PROJECT_NAME}' in workspace '${WORKSPACE}'"
INIT_JSON="$(railway init --name "$PROJECT_NAME" --workspace "$WORKSPACE" --json)"
PROJECT_ID="$(printf '%s' "$INIT_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")"

echo "==> Deploying template '${TEMPLATE}'"
railway deploy -t "$TEMPLATE"

echo "==> Waiting for services to appear"
for _ in $(seq 1 30); do
  SERVICE_COUNT="$(railway service list --json 2>/dev/null | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)"
  if [[ "$SERVICE_COUNT" -ge 4 ]]; then
    break
  fi
  sleep 2
done

echo ""
echo "==> Deploy started"
echo "    Project:  ${PROJECT_NAME}"
echo "    ID:       ${PROJECT_ID}"
echo "    Template: ${TEMPLATE}"
echo "    Work dir: ${WORK_DIR}"
echo ""
echo "PROJECT_ID=${PROJECT_ID}"
