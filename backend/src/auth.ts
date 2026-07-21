import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { organization } from 'better-auth/plugins'
import { db } from './db/client'
import * as schema from './db/schema'
import { ac, roles } from './auth/permissions'

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'
const betterAuthUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001'

// Railway `*.up.railway.app` is on the Public Suffix List, so the frontend and
// backend hosts are cross-site. SameSite=Lax cookies from the API are not stored
// / sent on credentialed fetches from the web app — login appears to succeed then
// bounce straight back to /login. Use None+Secure+Partitioned for that case.
function isCrossSiteAuth(): boolean {
  try {
    return new URL(frontendOrigin).hostname !== new URL(betterAuthUrl).hostname
  } catch {
    return false
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [frontendOrigin],
  ...(isCrossSiteAuth()
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
            partitioned: true,
          },
        },
      }
    : {}),
  plugins: [
    organization({
      ac,
      roles,
      allowUserToCreateOrganization: true,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      teams: {
        enabled: true,
        maximumTeams: 20,
        maximumMembersPerTeam: 50,
        allowRemovingAllTeams: false,
      },
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 25,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${frontendOrigin}/accept-invitation/${data.id}`
        // No email provider yet — log so invites still work via copy-link UX.
        console.log('[better-auth] organization invitation', {
          email: data.email,
          organization: data.organization.name,
          role: data.role,
          inviteLink,
        })
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
