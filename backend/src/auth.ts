import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { organization } from 'better-auth/plugins'
import { magicLink } from 'better-auth/plugins/magic-link'
import { passkey } from '@better-auth/passkey'
import { db } from './db/client'
import * as schema from './db/schema'
import { ac, roles } from './auth/permissions'
import { publicAuthLink, sendAppEmail, sendAppEmailBackground } from './lib/email'

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'
const betterAuthUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001'

function hostnameFromUrl(url: string, fallback: string): string {
  try {
    return new URL(url).hostname || fallback
  } catch {
    return fallback
  }
}

// WebAuthn rpID must match the browser-visible host (frontend), not the internal API host.
const passkeyRpID =
  process.env.PASSKEY_RP_ID ?? hostnameFromUrl(frontendOrigin, 'localhost')
const passkeyRpName = process.env.PASSKEY_RP_NAME ?? 'Larza'

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

function linkButton(href: string, label: string): string {
  return `<p><a href="${href}" style="display:inline-block;padding:10px 16px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px;">${label}</a></p>`
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = publicAuthLink(url, frontendOrigin)
      sendAppEmailBackground({
        to: user.email,
        subject: 'Verify your email address',
        text: `Welcome${user.name ? `, ${user.name}` : ''}!\n\nConfirm your email by opening this link:\n${verifyUrl}\n`,
        html: `<p>Welcome${user.name ? `, ${user.name}` : ''}!</p><p>Confirm your email to finish setting up your account.</p>${linkButton(verifyUrl, 'Verify email')}<p style="color:#666;font-size:12px;">Or paste this URL into your browser:<br/>${verifyUrl}</p>`,
      })
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const resetUrl = publicAuthLink(url, frontendOrigin)
      sendAppEmailBackground({
        to: user.email,
        subject: 'Reset your password',
        text: `Reset your password by opening this link:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hi${user.name ? ` ${user.name}` : ''},</p><p>We received a request to reset your password.</p>${linkButton(resetUrl, 'Reset password')}<p style="color:#666;font-size:12px;">Or paste this URL into your browser:<br/>${resetUrl}</p><p>If you did not request this, you can ignore this email.</p>`,
      })
    },
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
        const inviterName = data.inviter.user.name || data.inviter.user.email
        try {
          await sendAppEmail({
            to: data.email,
            subject: `Join ${data.organization.name}`,
            text: `${inviterName} invited you to join ${data.organization.name} as ${data.role}.\n\nAccept the invitation:\n${inviteLink}\n`,
            html: `<p><strong>${inviterName}</strong> invited you to join <strong>${data.organization.name}</strong> as <strong>${data.role}</strong>.</p>${linkButton(inviteLink, 'Accept invitation')}<p style="color:#666;font-size:12px;">Or paste this URL into your browser:<br/>${inviteLink}</p>`,
          })
        } catch (err) {
          // Keep invite usable via copy-link UX if delivery fails.
          console.error('[better-auth] invitation email failed', {
            email: data.email,
            organization: data.organization.name,
            inviteLink,
            error: err instanceof Error ? err.message : err,
          })
        }
      },
    }),
    magicLink({
      expiresIn: 60 * 10,
      sendMagicLink: async ({ email, url }) => {
        const magicUrl = publicAuthLink(url, frontendOrigin)
        sendAppEmailBackground({
          to: email,
          subject: 'Your sign-in link',
          text: `Sign in with this magic link (expires in 10 minutes):\n${magicUrl}\n`,
          html: `<p>Sign in with the button below. This link expires in 10 minutes.</p>${linkButton(magicUrl, 'Sign in')}<p style="color:#666;font-size:12px;">Or paste this URL into your browser:<br/>${magicUrl}</p>`,
        })
      },
    }),
    passkey({
      rpID: passkeyRpID,
      rpName: passkeyRpName,
      origin: frontendOrigin,
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
