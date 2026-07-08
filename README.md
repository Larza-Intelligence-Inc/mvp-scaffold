# One-click full-stack scaffold

Next.js (web) + Hono (api, OpenAPI/Swagger) + Postgres (db, Drizzle ORM).

## Local development

```bash
docker compose up --build -V              # -V refreshes node_modules after dep changes
docker compose exec backend npm run db:push   # create the `users` table
```

- Web: http://localhost:3000 · Swagger: http://localhost:3001/ui · DB: localhost:5432 (app/dev/app)
- Studio GUI: `docker compose exec backend npm run db:studio` → open https://local.drizzle.studio

Local uses the `Dockerfile.dev` images (hot reload). Production uses `Dockerfile`.

---

## Deploying to Railway

Railway does NOT use `docker-compose.yml`. You recreate the three services in one
Railway **project** (one project = one private network + shared reference variables).
Push this repo to GitHub first.

### 1. Postgres
New Project → **+ New** → **Database** → **PostgreSQL**. It exposes `DATABASE_URL`.

### 2. api service
### 2. backend service
**+ New → GitHub Repo →** this repo. In the service **Settings**:
- **Root Directory:** `backend`  (Railway then builds `backend/Dockerfile` — the production one)
- **Networking:** Generate a public domain if you want Swagger reachable (optional).

**Variables** (Settings → Variables):
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}      # reference var, stays in sync
PORT         = 3001                            # PIN it (see note) — app listens on $PORT
FRONTEND_ORIGIN   = https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}   # for CORS, once frontend exists
```
The production Dockerfile runs `db:migrate` on boot, so the committed migration in
`backend/drizzle/` creates the `users` table automatically on first deploy.

### 3. frontend service
**+ New → GitHub Repo →** same repo. In **Settings**:
- **Root Directory:** `frontend`
- **Networking:** Generate a public domain (this is the URL users visit).

**Variables:**
```
# Server-side Next fetches go over the PRIVATE network (no egress fees):
BACKEND_URL_INTERNAL   = http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}
# Only needed if/when you add BROWSER-side calls (inlined at build):
NEXT_PUBLIC_API_URL = https://${{api.RAILWAY_PUBLIC_DOMAIN}}
```

### Why PORT must be pinned
Railway injects a *random* `PORT` at runtime that you can't reference from another
service. Setting `PORT = 3001` on the api makes `${{api.PORT}}` resolve, so the web
service's private URL to the api is stable. The app still just reads `process.env.PORT`.

### The same three keys, filled differently
`DATABASE_URL`, `BACKEND_URL_INTERNAL`, `NEXT_PUBLIC_API_URL`, and `FRONTEND_ORIGIN` are the exact keys compose
sets locally — Railway just fills them from reference variables instead. That's the
whole point of the env-var contract: the code never changed.

### Notes
- Browser → api must use the PUBLIC domain; only server-side code may use `*.railway.internal`.
- For production rigor, keep using committed migrations (`db:generate` + `db:migrate`),
  not `db:push`.
- The Dockerfiles make the eventual move to your own GCP/AWS a deploy-target swap.
