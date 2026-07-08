import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// One demo table so Studio has something to show and the API has something to serve.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
