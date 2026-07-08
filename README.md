# Local Usage Guide

Full-stack scaffold: **Next.js** (web) + **Hono** (api) + **PostgreSQL** (db), orchestrated with Docker Compose.

| Service | Tech | Role |
|---------|------|------|
| **frontend** | Next.js 15 (React) | Frontend — server component fetches from the API |
| **backend** | Hono + Zod OpenAPI | Backend — REST API with auto-generated Swagger docs |
| **db** | PostgreSQL 17 | Database — accessed via Drizzle ORM |

The demo includes a `users` table and CRUD endpoints (`GET/POST /api/users`), plus a hello endpoint the frontend displays. Source is bind-mounted into containers for hot reload.

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
3. In Swagger, try `POST /api/users` with `{ "email": "ada@example.com", "name": "Ada" }`, then `GET /api/users`

> You do not need to copy `.env.example` for local Docker dev — `docker-compose.yml` injects the env vars. `.env.example` documents the contract for non-Docker or production deployments.

---

## 2) Useful URLs

| What | URL | Notes |
|------|-----|-------|
| **Web app** | http://localhost:3000 | Next.js frontend |
| **Swagger UI** | http://localhost:3001/ui | Interactive API docs — try endpoints here |
| **OpenAPI spec** | http://localhost:3001/doc | Raw JSON spec |
| **Health check** | http://localhost:3001/health | `{ "status": "ok" }` |
| **Hello endpoint** | http://localhost:3001/api/hello | Used by the frontend |
| **List users** | http://localhost:3001/api/users | Empty until you POST one |
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
- **Add API routes** — edit `backend/src/index.ts`; they appear in Swagger automatically
- **Change DB schema** — edit `backend/src/db/schema.ts`, then run `db:push` (or `db:generate` + `db:migrate`)
- **Node version** — controlled by `FROM node:22-alpine` in each Dockerfile, not `.nvmrc`

---

## Project layout

```
├── docker-compose.yml        # Orchestrates db, backend, frontend
├── .env.example              # Env var contract (reference only for local Docker)
├── backend/
│   ├── src/index.ts          # Hono routes + OpenAPI
│   ├── src/db/schema.ts      # Drizzle table definitions
│   └── drizzle/              # Generated migrations
└── frontend/
    └── app/page.tsx         # Next.js home page (server component)
```
