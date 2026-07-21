import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.PORT ?? 3001)
// Bind to `::` (IPv6, dual-stack) rather than the default 0.0.0.0. Railway's
// private network is IPv6-only, so services reached via `*.railway.internal`
// (e.g. the frontend proxying to the backend) MUST listen on IPv6. Dual-stack
// still accepts IPv4, so local Docker / localhost keep working.
serve({ fetch: app.fetch, port, hostname: '::' }, () => {
  console.log(`API listening on :${port}`)
  console.log(`Swagger UI → http://localhost:${port}/ui`)
  console.log(`DATABASE_URL present: ${Boolean(process.env.DATABASE_URL)}`)
})
