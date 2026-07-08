import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// DATABASE_URL is injected by docker-compose (host "db"). Same key gets filled by
// Railway / your own cloud later — the app code never changes.
const client = postgres(process.env.DATABASE_URL ?? '')
export const db = drizzle(client, { schema })
