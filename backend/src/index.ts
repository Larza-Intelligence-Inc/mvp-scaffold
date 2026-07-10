import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on :${port}`)
  console.log(`Swagger UI → http://localhost:${port}/ui`)
  console.log(`DATABASE_URL present: ${Boolean(process.env.DATABASE_URL)}`)
})
