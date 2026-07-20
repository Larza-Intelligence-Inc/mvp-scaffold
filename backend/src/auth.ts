import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { organization } from 'better-auth/plugins'
import { db } from './db/client'
import * as schema from './db/schema'

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [frontendOrigin],
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      async sendInvitationEmail(data) {
        const inviteLink = `${frontendOrigin}/accept-invitation/${data.id}`
        console.log('[better-auth] organization invitation', {
          email: data.email,
          organization: data.organization.name,
          inviteLink,
        })
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
