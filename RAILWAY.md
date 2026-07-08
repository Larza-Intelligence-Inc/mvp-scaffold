# Railway Deployment Guide

Deploy **your** GitHub repo (created in [GITHUB.md](GITHUB.md)) live on Railway and wire it for production + staging.

**Prerequisites:** You completed [GITHUB.md](GITHUB.md) — your own repo with `main` and `develop` branches at the same commit, cloned locally.

---

## Overview

```text
1. One-click deploy Railway template  →  new project (still points at template repo)
2. Connect GitHub + grant repo access
3. Run setup_project.py             →  repoint to YOUR repo, add staging, enable auto-deploy
4. Verify                             →  open frontend URL, check deployments
```

The one-click template bootstraps Postgres, backend, frontend, and Drizzle Gateway. The setup script in `scripts/railway/` repoints **frontend** and **backend** to your fork and configures branch-based deploys.

---

## 1) Deploy the Railway template

1. Open the one-click template: [railway.com/deploy/mvp-scaffold](https://railway.com/deploy/mvp-scaffold)
2. Sign in to Railway (or create an account).
3. Choose the **workspace** where the project should live (personal or team).
4. Click **Deploy Now** and wait for the initial deploy to finish.

You now have a Railway **project** with a `production` environment. The `frontend` and `backend` services are still connected to the public template repo (`Larza-Intelligence-Inc/mvp-scaffold`) — that is expected until you run the setup script.

### What gets created

| Service | Role |
|---------|------|
| **Postgres** | Database (`DATABASE_URL`) |
| **backend** | Hono API (`backend/` root directory) |
| **frontend** | Next.js app (`frontend/` root directory) |
| **drizzle-team/gateway** | Drizzle Studio GUI |

---

## 2) Connect GitHub to Railway

Railway needs access to **your** repo before the setup script can repoint services.

1. In the Railway dashboard, open your new project.
2. Go to **Account Settings** → **Connections** (or project **Settings** → GitHub).
3. Connect your GitHub account and install the Railway GitHub App.
4. Grant access to the repo you created in [GITHUB.md](GITHUB.md) (all repos, or select that repo only).

> For **private** repos, at least one Railway project member must have contributor access on GitHub.

---

## 3) Get your Project ID and API token

### Project ID

In the Railway project canvas, press **Cmd/Ctrl + K**, search **Copy Project ID**, and copy the value.

### API token

Create an account or workspace token at [railway.com/account/tokens](https://railway.com/account/tokens).

Keep this token secret. Do not commit it to git.

---

## 4) Run the setup script

From the **root of your cloned repo** (not the template repo):

### Install dependencies (one time)

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e .
```

### Configure environment

```bash
export RAILWAY_API_TOKEN="<your-token>"
export PROJECT_ID="<your-project-id>"
```

The script auto-detects your GitHub repo from `git remote origin`. You can override with `--repo owner/repo`.

### Dry run (recommended first)

```bash
python scripts/railway/setup_project.py --dry-run
```

Review the planned changes. No mutations are sent to Railway.

### Run for real

```bash
python scripts/railway/setup_project.py
```

Or use the installed CLI:

```bash
railway-setup
```

### What the script does

| Step | Action |
|------|--------|
| Preflight | Confirms you are **not** targeting the template origin repo |
| Production | Points `frontend` + `backend` at your repo on `main`, enables auto-deploy |
| Staging | Duplicates `production` → `staging`, points services at `develop` |
| Deploy | Commits staged config and triggers redeploys |

Safe to re-run — it skips steps already satisfied.

### Options

```bash
# Skip staging (if you don't have a develop branch)
python scripts/railway/setup_project.py --skip-staging

# Explicit repo / project overrides
python scripts/railway/setup_project.py \
  --repo my-org/my-app \
  --project-id <uuid>
```

### Environment variables (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `RAILWAY_API_TOKEN` | required | Railway API token |
| `PROJECT_ID` | required | Railway project ID |
| `NEW_REPO` | git `origin` | `owner/repo` override |
| `PROD_BRANCH` | `main` | Production deploy branch |
| `STAGING_BRANCH` | `develop` | Staging deploy branch |
| `STAGING_NAME` | `staging` | Staging environment name |

---

## 5) Verify

### In the Railway dashboard

1. Open **production** → **frontend** → **Settings** → Source. Repo should be `your-org/your-repo`, branch `main`.
2. Open **staging** → **frontend**. Branch should be `develop`.
3. Check **Deployments** on both services — latest builds should be `SUCCESS`.

### In the browser

| URL | What to expect |
|-----|----------------|
| Frontend public domain | Home page with API hello message |
| Backend public domain + `/ui` | Swagger UI |
| Backend public domain + `/health` | `{"status":"ok"}` |

Find domains under each service → **Settings** → **Networking**.

### Auto-deploy

Push a commit to `main` → production redeploys. Push to `develop` → staging redeploys.

---

## Troubleshooting

### `This script configures YOUR fork... cannot target the template origin`

You are running from or pointing at `Larza-Intelligence-Inc/mvp-scaffold`. Clone **your** repo from [GITHUB.md](GITHUB.md) and run the script there.

### `Railway can't access the GitHub repo`

Reconnect GitHub in Railway settings and grant the app access to your repo. Wait a minute, then re-run the script.

### `Missing PROJECT_ID` / `Missing RAILWAY_API_TOKEN`

Export both env vars before running, or pass `--project-id` and `--token`.

### Staging environment already exists

The script is idempotent. Re-running updates triggers and redeploys without recreating the environment.

### Manual setup reference

For service variables, root directories, and networking details, see [README.md](README.md#deploying-to-railway).

---

## What's next

| Guide | Purpose |
|-------|---------|
| [USAGE.md](USAGE.md) | Local development with Docker Compose |
| [GITHUB.md](GITHUB.md) | Create and branch your GitHub repo |
| `scripts/railway/tests/` | Run tests: `pip install -e ".[dev]" && pytest scripts/railway/tests/ -m "not integration"` |
