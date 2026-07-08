import { defineConfig } from 'drizzle-kit'

// Used by every `drizzle-kit` command (generate / migrate / push / studio).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
