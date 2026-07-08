---
name: spin-up-mvp-scaffold
description: >-
  Spin up a new app from the mvp-scaffold template: create a GitHub repo from
  the template, set up main/develop branches, deploy the Railway one-click
  template, and run the Railway setup script to wire production + staging.
  Use when the user wants to spin up a new repo, fork mvp-scaffold, bootstrap
  a new MVP project, deploy mvp-scaffold to Railway, or says "new project from
  scaffold".
---

# Spin Up MVP Scaffold

End-to-end workflow: **GitHub repo from template** → **main + develop branches** → **Railway deploy** → **setup script**.

**Template (never deploy directly):** `Larza-Intelligence-Inc/mvp-scaffold`  
**Railway one-click:** https://railway.com/deploy/mvp-scaffold

Skill root: `.cursor/skills/spin-up-mvp-scaffold/` (bundled scripts in `scripts/`).

Read this skill fully, then follow phases in order. Do not skip Phase 0.

---

## Phase 0 — Gather prerequisites (mandatory first step)

Use `AskQuestion` to collect **all** inputs before running any commands. If the user already provided values in chat, confirm them in one summary question rather than re-asking.

### Required inputs

| Input | Notes |
|-------|-------|
| **Repository name** | e.g. `my-app`, `acme-mvp` |
| **GitHub owner** | Personal username or org (e.g. `my-org`) |
| **Visibility** | `public` or `private` |
| **Clone directory** | Absolute path where the repo will be cloned (default: `~/REPO_NAME`) |

### GitHub prerequisites (verify before Phase 1)

- `gh` CLI installed (`gh --version`)
- Authenticated (`gh auth status`) — if not, run `gh auth login` and wait for the user

### Railway prerequisites (collect upfront; used in Phase 3)

| Input | Notes |
|-------|-------|
| **RAILWAY_API_TOKEN** | From https://railway.com/account/tokens — never commit |
| **PROJECT_ID** | From Railway dashboard after one-click deploy (Cmd/Ctrl+K → Copy Project ID) |
| **Skip staging?** | Default: no (creates `staging` env on `develop`) |

### Manual checkpoints (tell user upfront)

These steps require the user in a browser — pause and wait for confirmation:

1. **Railway one-click deploy** — user deploys https://railway.com/deploy/mvp-scaffold and picks a workspace
2. **GitHub ↔ Railway connection** — user connects GitHub in Railway and grants access to the new repo

### Derived values (compute, do not ask)

- Full repo slug: `{owner}/{repo_name}`
- Clone path: user-provided or `~/REPO_NAME`

Print a confirmation summary before proceeding:

```text
Repo:       owner/repo-name (public|private)
Clone to:   /absolute/path
Staging:    yes|no
Railway:    PROJECT_ID set, token provided
```

---

## Phase 1 — Create GitHub repo and branches

Run from this repo root (template or any checkout that includes this skill):

```bash
bash .cursor/skills/spin-up-mvp-scaffold/scripts/create_repo.sh \
  --owner OWNER \
  --name REPO_NAME \
  --visibility public|private \
  --clone-dir /absolute/path
```

**What it does:**

1. Creates repo from `Larza-Intelligence-Inc/mvp-scaffold` template via `gh`
2. Clones to the target directory
3. Ensures `main` and `develop` exist and point at the same commit

**Verify:**

```bash
cd /absolute/path
git rev-parse main develop   # must print identical SHAs
gh repo view owner/repo-name --json url -q .url
```

On failure, see [Appendix A — GitHub setup](#appendix-a--github-setup).

---

## Phase 2 — Railway one-click deploy + GitHub connection

Pause and instruct the user:

1. Open https://railway.com/deploy/mvp-scaffold
2. Sign in / create Railway account; pick workspace
3. Click **Deploy Now**; wait for initial deploy
4. In Railway → **Account Settings** → **Connections** (or project Settings → GitHub): connect GitHub, install Railway app, grant access to `{owner}/{repo_name}`

For private repos: at least one Railway project member needs GitHub contributor access.

**Wait for user confirmation** that deploy finished and GitHub is connected before Phase 3.

If the user has not provided `PROJECT_ID` yet, remind them: project canvas → Cmd/Ctrl+K → **Copy Project ID**.

### Services created by the Railway template

| Service | Role |
|---------|------|
| **Postgres** | Database (`DATABASE_URL`) |
| **backend** | Hono API (`backend/` root directory) |
| **frontend** | Next.js app (`frontend/` root directory) |
| **drizzle-team/gateway** | Drizzle Studio GUI |

Frontend and backend still point at the public template repo until Phase 3 — that is expected.

---

## Phase 3 — Run Railway setup script

Run against the **cloned fork** (not `Larza-Intelligence-Inc/mvp-scaffold`):

```bash
bash .cursor/skills/spin-up-mvp-scaffold/scripts/run_railway_setup.sh \
  --repo-dir /absolute/path \
  --project-id PROJECT_ID \
  --token RAILWAY_API_TOKEN \
  --repo owner/repo-name \
  --dry-run
```

Review dry-run output with the user, then run without `--dry-run`:

```bash
bash .cursor/skills/spin-up-mvp-scaffold/scripts/run_railway_setup.sh \
  --repo-dir /absolute/path \
  --project-id PROJECT_ID \
  --token RAILWAY_API_TOKEN \
  --repo owner/repo-name
```

Add `--skip-staging` if the user opted out of staging in Phase 0.

**What the setup script does** (`scripts/railway/setup_project.py` in the cloned repo):

| Step | Action |
|------|--------|
| Preflight | Refuses to target `Larza-Intelligence-Inc/mvp-scaffold` |
| Production | Points `frontend` + `backend` at your repo on `main`, enables auto-deploy |
| Staging | Duplicates `production` → `staging`, points services at `develop` |
| Deploy | Commits staged config and triggers redeploys |

Safe to re-run — skips steps already satisfied.

### Manual alternative (no wrapper script)

From the cloned fork root:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
export RAILWAY_API_TOKEN="<token>"
export PROJECT_ID="<project-id>"
python scripts/railway/setup_project.py --dry-run
python scripts/railway/setup_project.py
```

On failure, see [Appendix B — Railway setup](#appendix-b--railway-setup).

---

## Phase 4 — Verify

### Railway dashboard

1. **production** → **frontend** → Settings → Source: `{owner}/{repo}`, branch `main`
2. **staging** → **frontend** → branch `develop` (if staging enabled)
3. Deployments on frontend + backend: `SUCCESS`

### Browser

| URL | Expected |
|-----|----------|
| Frontend public domain | Home page with API hello message |
| Backend `/ui` | Swagger UI |
| Backend `/health` | `{"status":"ok"}` |

Domains: each service → Settings → Networking.

### Auto-deploy

Push to `main` → production redeploys. Push to `develop` → staging redeploys.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `cannot target the template origin` | Run from cloned fork, not `Larza-Intelligence-Inc/mvp-scaffold` |
| `Missing PROJECT_ID` / `Missing RAILWAY_API_TOKEN` | Re-export env vars or pass `--project-id` / `--token` |
| Railway can't access GitHub repo | Reconnect GitHub in Railway; grant repo access; wait ~1 min |
| `gh: Not authenticated` | `gh auth login` |
| Branches differ | Re-run `create_repo.sh` or see Appendix A |
| Staging already exists | Script is idempotent; re-run updates triggers |

---

## Appendix A — GitHub setup

Create **your own** copy of the scaffold. Do not deploy `Larza-Intelligence-Inc/mvp-scaffold` directly.

### GitHub UI

1. Open the template → **Use this template** → **Create a new repository**
2. Choose **Owner**, **Repository name**, **Visibility**
3. Click **Create repository**

### GitHub CLI

```bash
gh repo create my-app --template Larza-Intelligence-Inc/mvp-scaffold --public
gh repo create my-org/my-app --template Larza-Intelligence-Inc/mvp-scaffold --private
```

### Clone

```bash
git clone git@github.com:<OWNER>/<REPO>.git
cd <REPO>
```

### Align `main` and `develop`

Railway expects both branches at the **same starting commit**.

**Only `develop` (template default):**

```bash
git checkout develop && git pull origin develop
git checkout -b main && git push -u origin main && git push -u origin develop
```

**Only `main`:**

```bash
git checkout main && git pull origin main
git checkout -b develop && git push -u origin develop && git push -u origin main
```

**Both exist:**

```bash
git checkout main && git pull origin main
git checkout develop && git merge main && git push origin develop
```

**Verify:** `git rev-parse main` and `git rev-parse develop` must print the same SHA.

---

## Appendix B — Railway setup

### Setup script options

```bash
python scripts/railway/setup_project.py --skip-staging
python scripts/railway/setup_project.py --repo my-org/my-app --project-id <uuid> --token <token>
```

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `RAILWAY_API_TOKEN` | required | Railway API token |
| `PROJECT_ID` | required | Railway project ID |
| `NEW_REPO` | git `origin` | `owner/repo` override |
| `PROD_BRANCH` | `main` | Production deploy branch |
| `STAGING_BRANCH` | `develop` | Staging deploy branch |
| `STAGING_NAME` | `staging` | Staging environment name |

### Tests

```bash
pip install -e ".[dev]" && pytest scripts/railway/tests/ -m "not integration"
```

---

## What's next

| Resource | Purpose |
|----------|---------|
| [USAGE.md](../../../USAGE.md) | Local development with Docker Compose |
| [README.md](../../../README.md) | Manual Railway service/variable reference |
