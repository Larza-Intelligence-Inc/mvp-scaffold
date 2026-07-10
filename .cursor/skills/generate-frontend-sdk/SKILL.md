---
name: generate-frontend-sdk
description: >-
  Regenerate the frontend TypeScript SDK from the committed backend OpenAPI
  lockfile. Emits backend/openapi.json from the Hono app (no server), then runs
  openapi-typescript into frontend/generated/backend. Use after changing backend
  routes or schemas, before frontend work against new endpoints, or when the
  OpenAPI lockfile / generated schema is stale.
---

# Generate Frontend SDK

Regenerate the API surface lockfile and the frontend `openapi-fetch` types from it.
**Never start or stop the API process** — codegen is file-based only.

## Step 1 — Emit `backend/openapi.json`

From the repo's `backend/` directory:

```bash
npm run openapi:emit
```

This imports the Hono app (no `serve()`), writes `backend/openapi.json` with `servers: [{ url: '/' }]`, and exits.

If the command fails, stop and report the error (often missing `npm install` in `backend/`).

## Step 2 — Generate frontend types

From the repo's `frontend/` directory:

```bash
npm run generate:api
```

This runs `openapi-typescript` against `../backend/openapi.json` and overwrites `generated/backend/schema.ts`.

Do **not** edit `schema.ts` by hand. `generated/backend/client.ts` is hand-written and must not be overwritten.

If codegen fails, stop and report the error (often missing `npm install` in `frontend/`, or a stale/missing `openapi.json`).

## Step 3 — Report

- Confirm both commands succeeded.
- List files that changed (`backend/openapi.json`, `frontend/generated/backend/schema.ts`).
- Remind the user to commit the lockfile + generated schema alongside route changes.
