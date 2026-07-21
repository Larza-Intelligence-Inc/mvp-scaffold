# Local Usage Guide

Full-stack scaffold: **Next.js** (web) + **Hono** (api) + **PostgreSQL** (db), orchestrated with Docker Compose.

| Service | Tech | Role |
|---------|------|------|
| **frontend** | Next.js 15 (React) | Frontend — server component fetches from the API |
| **backend** | Hono + Zod OpenAPI | Backend — REST API with auto-generated Swagger docs |
| **db** | PostgreSQL 17 | Database — accessed via Drizzle ORM |

The demo includes Better Auth (email/password + organizations), a hello endpoint the frontend displays, and `GET /api/me` for the current session. Source is bind-mounted into containers for hot reload.

---

## 1) First-time setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose v2)
- Ports **3000**, **3001**, **5432**, and **4983** available on your machine

### Steps

```bash
# 2. Build images and start all services
#    -V recreates anonymous volumes (fresh node_modules in containers)
docker compose up --build -V
```

Wait until you see logs like `API listening on :3001` and the Next.js dev server is ready. The API starts only after Postgres passes its health check.

In a **second terminal** (while the stack is running):

```bash
# 3. Create the database tables (required once, or after schema changes)
docker compose exec backend npm run db:push
```

### Verify it works

1. Open http://localhost:3000 — you should see "API says: Hello from the Hono API 👋"
2. Open http://localhost:3001/ui — Swagger UI
3. Sign up at http://localhost:3000/sign-up, then open `/dashboard` to create an organization
4. Call `GET /api/me` (with session cookie) to verify auth

> You do not need to copy `.env.example` for local Docker dev — `docker-compose.yml` injects the env vars. `.env.example` documents the contract for non-Docker or production deployments.

---

## 2) Useful URLs

| What | URL | Notes |
|------|-----|-------|
| **Web app** | http://localhost:3000 | Next.js frontend |
| **Swagger UI** | http://localhost:3001/ui | Interactive API docs — try endpoints here |
| **OpenAPI (runtime)** | http://localhost:3001/openapi.json | Live JSON (exploration only) |
| **OpenAPI lockfile** | `backend/openapi.json` | Committed artifact used for frontend codegen |
| **Health check** | http://localhost:3001/health | `{ "status": "ok" }` |
| **Hello endpoint** | http://localhost:3001/api/hello | Used by the frontend |
| **Auth** | http://localhost:3001/api/auth/* | Better Auth (sign-up, session, orgs) |
| **Current user** | http://localhost:3001/api/me | Requires session cookie |
| **Sign up / Login** | http://localhost:3000/sign-up · /login | Untitled UI auth pages |
| **Drizzle Studio** | https://local.drizzle.studio | DB GUI — only after running `db:studio` (see below) |
| **Postgres** | `localhost:5432` | User: `app`, Password: `dev`, Database: `app` |

---

## 3) Useful commands

All commands below assume you are in the project root.

### Starting & stopping

```bash
# Start (foreground, see logs)
docker compose up --build -V

# Start detached (background)
docker compose up --build -V -d

# Stop services (keeps database data)
docker compose down

# Stop AND wipe the database volume (full reset)
docker compose down -v

# Stop a single service
docker compose stop backend
```

If you started in the foreground, `Ctrl+C` stops the stack. Run `docker compose down` afterward if containers are still running.

### Installing packages

Packages live **inside the containers**, not on your host. Install via `exec`:

```bash
# Backend
docker compose exec backend npm install <package-name>

# Frontend
docker compose exec frontend npm install <package-name>
```

If you edited `package.json` directly or changed a Dockerfile, rebuild so `node_modules` is refreshed:

```bash
# Rebuild everything
docker compose up --build -V

# Rebuild just one service
docker compose up --build -V backend
docker compose up --build -V frontend
```

### Database (Drizzle)

Run these inside the **backend** container:

```bash
# Sync schema to DB (fast, good for dev) — use after changing schema.ts
docker compose exec backend npm run db:push

# Generate versioned SQL migration files (production-style)
docker compose exec backend npm run db:generate

# Apply migration files
docker compose exec backend npm run db:migrate

# Launch Drizzle Studio GUI
docker compose exec backend npm run db:studio
# Then open https://local.drizzle.studio
```

### Logs & shell access

```bash
# Follow all logs
docker compose logs -f

# Logs for one service
docker compose logs -f backend

# Shell into a container
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec db psql -U app -d app
```

### Development workflow

- **Edit code** — save files under `backend/` or `frontend/`; hot reload picks up changes automatically
- **Add API routes** — edit `backend/src/app.ts`; they appear in Swagger automatically. Then regenerate the SDK (below).
- **Change DB schema** — edit `backend/src/db/schema.ts`, then run `db:push` (or `db:generate` + `db:migrate`)
- **Node version** — controlled by `FROM node:22-alpine` in each Dockerfile, not `.nvmrc`

### OpenAPI lockfile + frontend SDK

The API surface is locked in **`backend/openapi.json`** (committed). Frontend types are generated from that **file**, not from a running server — so builds never need a live backend.

```bash
# After changing routes/schemas in backend/src/app.ts:
cd backend && npm run openapi:emit
cd ../frontend && npm run generate:api
```

Or ask the agent to run the **generate-frontend-sdk** skill (same two steps; never starts the API).

| Piece | Role |
|-------|------|
| `backend/openapi.json` | API lockfile (`servers: [{ url: '/' }]` — origin comes from the client) |
| `frontend/generated/backend/schema.ts` | Generated types (`openapi-typescript`) |
| `frontend/generated/backend/client.ts` | Hand-written `openapi-fetch` client; `baseUrl` from env |
| `BACKEND_URL_INTERNAL` | Server-side base URL (e.g. `http://backend:3001` in Docker). Browser `/api/*` calls are proxied here via `next.config.js` rewrites — no public API URL is baked into the build. |

Runtime `/openapi.json` and `/ui` remain available for local exploration; codegen does not use them.

---

## Environment variables

App code only ever reads named vars (never hardcodes URLs), and cross-service URLs are **derived**, not typed by hand:

- **Browser → API:** the browser calls `/api/*` on its **own origin**; `frontend/next.config.js` rewrites proxy those to `BACKEND_URL_INTERNAL` server-side. There is no `NEXT_PUBLIC_*` API URL, so one frontend build runs unchanged in local, cloud, PR, staging and prod.
- **Local (Docker):** values come from `docker-compose.yml` service DNS (e.g. `http://backend:3001`).
- **Railway (all environments, including PR):** cross-service values use **reference variables** so they re-resolve automatically per environment (PR envs get their own generated domains with zero manual edits):

| Service | Variable | Value (Railway reference) |
|---------|----------|---------------------------|
| backend | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| backend | `BETTER_AUTH_URL` | `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` |
| backend | `FRONTEND_ORIGIN` | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}` |
| frontend | `BACKEND_URL_INTERNAL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3001` |

Set/verify these with the Railway CLI, e.g. `railway variable set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' --service backend --environment staging` and `railway variables --service backend --environment staging --kv`.

---

## Project layout

```
├── docker-compose.yml        # Orchestrates db, backend, frontend
├── .env.example              # Env var contract (reference only for local Docker)
├── .cursor/skills/
│   ├── spin-up-mvp-scaffold/ # Bootstrap a new project from this template
│   └── generate-frontend-sdk/# Emit openapi.json + regenerate frontend types
├── backend/
│   ├── openapi.json          # Committed OpenAPI lockfile
│   ├── scripts/emit-openapi.ts
│   ├── src/app.ts            # Hono routes + OpenAPI registration
│   ├── src/index.ts          # serve() entry only
│   ├── src/db/schema.ts      # Drizzle table definitions
│   └── drizzle/              # Generated migrations
└── frontend/
    ├── generated/backend/    # openapi-fetch SDK (schema.ts generated)
    └── app/page.tsx          # Next.js home page (server component)
```

---

## Spinning up a new project from this template

### Prerequisites

1. A [Railway](https://railway.com) account with your GitHub connected to it
2. [GitHub CLI](https://cli.github.com/) and [Railway CLI](https://docs.railway.com/guides/cli) installed and logged in on your machine
3. [Cursor](https://cursor.com), Codex, Claude Code, or an equivalent AI coding agent that can run the start command below

### Start command

Paste this into your agent to initiate a new project:

```
Initiate a new github project by copying the public github template repo -- https://github.com/Larza-Intelligence-Inc/mvp-scaffold

Inside it, you will find a skill for how to intiate the project called "spin-up-mvp-scaffold". Run the skill.
```
