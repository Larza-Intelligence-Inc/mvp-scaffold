# AGENTS.md

## Cursor Cloud specific instructions

Full-stack scaffold: **frontend** (Next.js 15, `frontend/`), **backend** (Hono + Zod OpenAPI, `backend/`), **db** (PostgreSQL). There is also a secondary Python tool in `scripts/railway/` for post-template Railway setup.

The `README.md` documents the intended local flow via **Docker Compose** (`docker compose up --build -V`). Docker is **not** available in the Cursor Cloud VM, so run the services natively instead (Postgres + two `npm run dev` servers). This is the key difference from the README.

Cloud boot is configured in `.cursor/environment.json`: `install` refreshes deps, `start` brings up Postgres, and `terminals` run `db:push` then the backend/frontend dev servers. Prefer those running tmux sessions over starting duplicate processes. Re-run schema sync yourself after editing `backend/src/db/schema.ts` during a session.

### PostgreSQL (native)
- Installed as system PostgreSQL 16 (the Docker image uses 17; not significant for dev). Cloud agents start it via `environment.json` `start` (`sudo pg_ctlcluster 16 main start`). If it is down: run that command, then `pg_isready -h localhost`.
- A role `app` (password `dev`) and database `app` exist on `localhost:5432`, matching the `docker-compose.yml` credentials. Connection string for native use: `postgres://app:dev@localhost:5432/app` (note `localhost`, not the Docker hostname `db`).

### Backend (`backend/`)
- Dev server (also started by the `backend` terminal): `PORT=3001 DATABASE_URL="postgres://app:dev@localhost:5432/app" FRONTEND_ORIGIN="http://localhost:3000" npm run dev --prefix backend` (tsx watch). Serves API on `:3001`, Swagger UI at `/ui`.
- Sync tables after any `src/db/schema.ts` change: `DATABASE_URL="postgres://app:dev@localhost:5432/app" npm run db:push --prefix backend` (see `package.json` for `db:generate`/`db:migrate`/`db:studio`). Boot already runs `db:push` once before the API starts.
- No JS lint config exists; typecheck with `npx tsc --noEmit`.

### Frontend (`frontend/`)
- Dev server (also started by the `frontend` terminal): `BACKEND_URL_INTERNAL="http://localhost:3001" npm run dev --prefix frontend`. Serves on `:3000`. The browser calls `/api/*` on the frontend origin; `next.config.js` rewrites proxy those to `BACKEND_URL_INTERNAL` server-side (point it at `localhost:3001`, not the Docker hostname `backend`). Server components also fetch `/api/hello` from `BACKEND_URL_INTERNAL`.

### Python Railway setup tool (`scripts/railway/`)
- Installed into `.venv` (editable). Run unit tests: `.venv/bin/pytest scripts/railway/tests/ -m "not integration"`. Integration tests need a live Railway API token and are skipped by default.
