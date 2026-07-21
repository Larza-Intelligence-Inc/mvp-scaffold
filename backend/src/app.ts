import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { auth } from './auth'
import { openApiConfig } from './openapi-config'

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

// OpenAPIHono is a drop-in extension of Hono: routes defined via createRoute
// generate the OpenAPI spec automatically, so the docs can never drift.
export const app = new OpenAPIHono()

app.use(
  '/*',
  cors({
    origin: frontendOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

const ErrorSchema = z.object({ error: z.string() }).openapi('Error')

const MeUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    image: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('MeUser')

const MeSessionSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.string(),
    activeOrganizationId: z.string().nullable().optional(),
    activeTeamId: z.string().nullable().optional(),
  })
  .openapi('MeSession')

const MeResponseSchema = z
  .object({
    user: MeUserSchema,
    session: MeSessionSchema,
  })
  .openapi('MeResponse')

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

// ---------- current session (cookie auth) ----------
app.openapi(
  createRoute({
    method: 'get',
    path: '/api/me',
    responses: {
      200: { description: 'Current user session', content: { 'application/json': { schema: MeResponseSchema } } },
      401: { description: 'Not authenticated', content: { 'application/json': { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    return c.json(
      {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
          createdAt: session.user.createdAt.toISOString(),
          updatedAt: session.user.updatedAt.toISOString(),
        },
        session: {
          id: session.session.id,
          userId: session.session.userId,
          expiresAt: session.session.expiresAt.toISOString(),
          activeOrganizationId: session.session.activeOrganizationId ?? null,
          activeTeamId:
            (session.session as { activeTeamId?: string | null }).activeTeamId ??
            null,
        },
      },
      200,
    )
  },
)

// ---------- OpenAPI JSON + Swagger UI (runtime exploration only; codegen uses openapi.json) ----------
app.doc('/doc', openApiConfig)
app.doc('/openapi.json', openApiConfig)
app.get('/ui', swaggerUI({ url: '/openapi.json' }))
