# AGENTS.md

## Cursor Cloud specific instructions

Full-stack scaffold: **frontend** (Next.js 15, `frontend/`), **backend** (Hono + Zod OpenAPI, `backend/`), **db** (PostgreSQL). There is also a secondary Python tool in `scripts/railway/` for post-template Railway setup.

The `README.md` documents the intended local flow via **Docker Compose** (`docker compose up --build -V`). Docker is **not** available in the Cursor Cloud VM, so run the services natively instead (Postgres + two `npm run dev` servers). This is the key difference from the README.

### PostgreSQL (native)
- Installed as system PostgreSQL 16 (the Docker image uses 17; not significant for dev). It is **not** auto-started on VM boot — start it first: `sudo pg_ctlcluster 16 main start`.
- A role `app` (password `dev`) and database `app` exist on `localhost:5432`, matching the `docker-compose.yml` credentials. Connection string for native use: `postgres://app:dev@localhost:5432/app` (note `localhost`, not the Docker hostname `db`).

### Backend (`backend/`)
- Run from `backend/`: `PORT=3001 DATABASE_URL="postgres://app:dev@localhost:5432/app" FRONTEND_ORIGIN="http://localhost:3000" npm run dev` (tsx watch, hot reload). Serves API on `:3001`, Swagger UI at `/ui`.
- Create/sync tables after any `src/db/schema.ts` change: `DATABASE_URL="postgres://app:dev@localhost:5432/app" npm run db:push` (see `package.json` for `db:generate`/`db:migrate`/`db:studio`).
- No JS lint config exists; typecheck with `npx tsc --noEmit`.

### Frontend (`frontend/`)
- Run from `frontend/`: `BACKEND_URL_INTERNAL="http://localhost:3001" NEXT_PUBLIC_API_URL="http://localhost:3001" npm run dev`. Serves on `:3000`. The home page is a server component that fetches `/api/hello` from `BACKEND_URL_INTERNAL` — point it at `localhost:3001` (not the Docker hostname `backend`).

### Python Railway setup tool (`scripts/railway/`)
- Installed into `.venv` (editable). Run unit tests: `.venv/bin/pytest scripts/railway/tests/ -m "not integration"`. Integration tests need a live Railway API token and are skipped by default.
