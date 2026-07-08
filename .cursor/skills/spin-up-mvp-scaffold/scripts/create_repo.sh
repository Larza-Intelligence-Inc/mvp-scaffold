#!/usr/bin/env bash
# Create a GitHub repo from the mvp-scaffold template, clone it, and align main/develop.
set -euo pipefail

TEMPLATE="Larza-Intelligence-Inc/mvp-scaffold"
OWNER=""
NAME=""
VISIBILITY="public"
CLONE_DIR=""

usage() {
  cat <<'EOF'
Usage: create_repo.sh --owner OWNER --name REPO_NAME [options]

Options:
  --owner OWNER       GitHub user or org (required)
  --name REPO_NAME    Repository name (required)
  --visibility VIS    public or private (default: public)
  --clone-dir PATH    Where to clone (default: ~/REPO_NAME)
  -h, --help          Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner) OWNER="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --visibility) VISIBILITY="$2"; shift 2 ;;
    --clone-dir) CLONE_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$OWNER" || -z "$NAME" ]]; then
  echo "Error: --owner and --name are required." >&2
  usage
  exit 1
fi

if [[ "$VISIBILITY" != "public" && "$VISIBILITY" != "private" ]]; then
  echo "Error: --visibility must be public or private." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed. Install from https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

FULL_REPO="${OWNER}/${NAME}"
CLONE_DIR="${CLONE_DIR:-${HOME}/${NAME}}"

echo "==> Creating ${FULL_REPO} from template ${TEMPLATE} (${VISIBILITY})"
if gh repo view "$FULL_REPO" >/dev/null 2>&1; then
  echo "    Repo already exists — skipping create."
else
  gh repo create "$FULL_REPO" --template "$TEMPLATE" "--${VISIBILITY}"
fi

if [[ -d "$CLONE_DIR/.git" ]]; then
  echo "==> Clone directory already exists: ${CLONE_DIR}"
  cd "$CLONE_DIR"
  git fetch origin
else
  echo "==> Cloning to ${CLONE_DIR}"
  git clone "git@github.com:${FULL_REPO}.git" "$CLONE_DIR"
  cd "$CLONE_DIR"
fi

echo "==> Aligning main and develop branches"
git fetch origin --prune

has_remote_branch() {
  git ls-remote --heads origin "$1" | grep -q .
}

if has_remote_branch develop && ! has_remote_branch main; then
  git checkout develop
  git pull origin develop
  git checkout -b main
  git push -u origin main
  git push -u origin develop
elif has_remote_branch main && ! has_remote_branch develop; then
  git checkout main
  git pull origin main
  git checkout -b develop
  git push -u origin develop
  git push -u origin main
elif has_remote_branch main && has_remote_branch develop; then
  git checkout main
  git pull origin main
  git checkout develop
  git pull origin develop
  git merge main
  git push origin develop
else
  current="$(git branch --show-current)"
  if [[ "$current" == "develop" ]]; then
    git checkout -B main
    git push -u origin main
    git checkout develop
    git push -u origin develop
  else
    git checkout -B develop
    git push -u origin develop
    git checkout main 2>/dev/null || git checkout -B main
    git push -u origin main
  fi
fi

MAIN_SHA="$(git rev-parse main)"
DEVELOP_SHA="$(git rev-parse develop)"

echo ""
echo "==> Done"
echo "    Repo:     https://github.com/${FULL_REPO}"
echo "    Clone:    ${CLONE_DIR}"
echo "    main:     ${MAIN_SHA}"
echo "    develop:  ${DEVELOP_SHA}"

if [[ "$MAIN_SHA" != "$DEVELOP_SHA" ]]; then
  echo "Warning: main and develop differ — Railway staging may be out of sync." >&2
  exit 1
fi
