import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { db } from './db/client'
import { users } from './db/schema'

// OpenAPIHono is a drop-in extension of Hono: routes defined via createRoute
// generate the OpenAPI spec automatically, so the docs can never drift.
const app = new OpenAPIHono()
// Locally this is localhost:3000; on Railway set FRONTEND_ORIGIN to the web service's public URL.
app.use('/*', cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000' }))

// ---------- schemas (double as request validation AND doc components) ----------
const UserSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    email: z.string().email().openapi({ example: 'ada@example.com' }),
    name: z.string().nullable().openapi({ example: 'Ada Lovelace' }),
    createdAt: z.string().openapi({ example: '2026-01-01T00:00:00.000Z' }),
  })
  .openapi('User')

const NewUserSchema = z
  .object({
    email: z.string().email().openapi({ example: 'ada@example.com' }),
    name: z.string().optional().openapi({ example: 'Ada Lovelace' }),
  })
  .openapi('NewUser')

const ErrorSchema = z.object({ error: z.string() }).openapi('Error')

// ---------- health ----------
app.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: z.object({ status: z.string() }) } } },
    },
  }),
  (c) => c.json({ status: 'ok' }, 200),
)

// ---------- hello ----------
app.openapi(
  createRoute({
    method: 'get',
    path: '/api/hello',
    responses: {
      200: { description: 'Greeting', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    },
  }),
  (c) => c.json({ message: 'Hello from the Hono API 👋' }, 200),
)

// ---------- list users (reads from Postgres via Drizzle) ----------
app.openapi(
  createRoute({
    method: 'get',
    path: '/api/users',
    responses: {
      200: { description: 'List of users', content: { 'application/json': { schema: z.array(UserSchema) } } },
      500: { description: 'DB not ready', content: { 'application/json': { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    try {
      const rows = await db.select().from(users)
      return c.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), 200)
    } catch {
      return c.json({ error: 'Could not query users — run `npm run db:push` to create the table first.' }, 500)
    }
  },
)

// ---------- create user (validated body, writes to Postgres) ----------
app.openapi(
  createRoute({
    method: 'post',
    path: '/api/users',
    request: { body: { content: { 'application/json': { schema: NewUserSchema } } } },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: UserSchema } } },
      500: { description: 'Insert failed', content: { 'application/json': { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const body = c.req.valid('json')
    try {
      const [row] = await db.insert(users).values(body).returning()
      return c.json({ ...row, createdAt: row.createdAt.toISOString() }, 201)
    } catch {
      return c.json({ error: 'Insert failed — run `npm run db:push` first, or that email already exists.' }, 500)
    }
  },
)

// ---------- OpenAPI JSON + Swagger UI ----------
app.doc('/doc', { openapi: '3.0.0', info: { title: 'Scaffold API', version: '1.0.0' } })
app.get('/ui', swaggerUI({ url: '/doc' }))

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on :${port}`)
  console.log(`Swagger UI → http://localhost:${port}/ui`)
  console.log(`DATABASE_URL present: ${Boolean(process.env.DATABASE_URL)}`)
})
