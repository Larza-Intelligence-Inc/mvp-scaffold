/**
 * End-to-end Better Auth email flows via Resend:
 * - verification on sign-up
 * - password reset
 * - magic link
 * - organization invitation
 *
 * Requires DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY.
 * Recipient defaults to the Resend account owner's inbox (test-mode restriction).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { auth } from './auth'
import { db } from './db/client'
import { user } from './db/schema'
import { getResend } from './lib/resend'

const hasResend = Boolean(process.env.RESEND_API_KEY)
const hasDb = Boolean(process.env.DATABASE_URL)
const hasSecret = Boolean(process.env.BETTER_AUTH_SECRET)
const testTo = process.env.AUTH_EMAIL_TEST_TO ?? 'vihar@larza.ai'

async function deleteUserByEmail(email: string) {
  await db.delete(user).where(eq(user.email, email))
}

function cookieFromResponse(res: Response): string {
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie().join('; ')
  }
  return res.headers.get('set-cookie') ?? ''
}

async function waitForRecentEmail(subjectIncludes: string, sinceMs: number, attempts = 16) {
  const resend = getResend()
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await resend.emails.list({ limit: 25 })
    if (error) throw new Error(error.message)
    const match = data?.data?.find((email) => {
      const to = email.to ?? []
      const created = email.created_at ? Date.parse(email.created_at) : 0
      return (
        to.includes(testTo) &&
        typeof email.subject === 'string' &&
        email.subject.toLowerCase().includes(subjectIncludes.toLowerCase()) &&
        created >= sinceMs - 2000
      )
    })
    if (match) return match
    await new Promise((r) => setTimeout(r, 750))
  }
  throw new Error(`Timed out waiting for email to=${testTo} subject~=${subjectIncludes}`)
}

test(
  'sign-up sends verification email via Resend',
  { skip: !hasResend || !hasDb || !hasSecret },
  async () => {
    await deleteUserByEmail(testTo)
    const sinceMs = Date.now()
    const result = await auth.api.signUpEmail({
      body: {
        name: 'Verify User',
        email: testTo,
        password: 'password1234',
        callbackURL: 'http://localhost:3000/dashboard',
      },
    })
    assert.ok(result, 'sign-up should return a user payload')
    await new Promise((r) => setTimeout(r, 300))
    const sent = await waitForRecentEmail('Verify', sinceMs)
    assert.ok(sent.id)
  },
)

test(
  'password reset sends email via Resend',
  { skip: !hasResend || !hasDb || !hasSecret },
  async () => {
    await deleteUserByEmail(testTo)
    await auth.api.signUpEmail({
      body: {
        name: 'Reset User',
        email: testTo,
        password: 'password1234',
        callbackURL: 'http://localhost:3000/dashboard',
      },
    })
    await new Promise((r) => setTimeout(r, 300))
    await waitForRecentEmail('Verify', Date.now() - 15_000)

    const sinceMs = Date.now()
    const reset = await auth.api.requestPasswordReset({
      body: {
        email: testTo,
        redirectTo: 'http://localhost:3000/reset-password',
      },
    })
    assert.equal(reset.status, true)
    await new Promise((r) => setTimeout(r, 300))
    const sent = await waitForRecentEmail('Reset', sinceMs)
    assert.ok(sent.id)
  },
)

test(
  'magic link sends email via Resend',
  { skip: !hasResend || !hasDb || !hasSecret },
  async () => {
    const sinceMs = Date.now()
    const result = await auth.api.signInMagicLink({
      body: {
        email: testTo,
        name: 'Magic User',
        callbackURL: 'http://localhost:3000/dashboard',
      },
      headers: new Headers({
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      }),
    })
    assert.ok(result)
    await new Promise((r) => setTimeout(r, 300))
    const sent = await waitForRecentEmail('sign-in', sinceMs)
    assert.ok(sent.id)
  },
)

test(
  'organization invitation sends email via Resend',
  { skip: !hasResend || !hasDb || !hasSecret },
  async () => {
    const inviterEmail = `inviter-${Date.now()}@example.com`
    await deleteUserByEmail(inviterEmail)
    await deleteUserByEmail(testTo)

    await auth.api.signUpEmail({
      body: {
        name: 'Org Inviter',
        email: inviterEmail,
        password: 'password1234',
        callbackURL: 'http://localhost:3000/dashboard',
      },
    })
    await db.update(user).set({ emailVerified: true }).where(eq(user.email, inviterEmail))

    const signIn = await auth.api.signInEmail({
      body: { email: inviterEmail, password: 'password1234' },
      headers: new Headers({
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      }),
      asResponse: true,
    })
    assert.equal(signIn.status, 200)
    const cookie = cookieFromResponse(signIn)
    assert.ok(cookie.includes('='), 'expected session cookie after sign-in')

    const headers = new Headers({
      origin: 'http://localhost:3000',
      cookie,
      'content-type': 'application/json',
    })

    const org = await auth.api.createOrganization({
      body: {
        name: `Invite Org ${Date.now()}`,
        slug: `invite-org-${Date.now()}`,
      },
      headers,
    })
    assert.ok(org?.id)

    const sinceMs = Date.now()
    await auth.api.createInvitation({
      body: {
        email: testTo,
        role: 'member',
        organizationId: org.id,
      },
      headers,
    })
    await new Promise((r) => setTimeout(r, 300))
    const sent = await waitForRecentEmail('Join', sinceMs)
    assert.ok(sent.id)
  },
)
