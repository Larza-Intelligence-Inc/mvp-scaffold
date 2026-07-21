/**
 * End-to-end Hono + Resend send, adapted from:
 * https://github.com/resend/resend-examples/blob/main/hono-resend-examples/typescript/examples/basic-send.ts
 *
 * Hits POST /api/send on the in-process Hono app (no listen) against the live Resend API.
 * Requires RESEND_API_KEY.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from './app'

test('POST /api/send sends a basic email via Resend', async () => {
  assert.ok(process.env.RESEND_API_KEY, 'RESEND_API_KEY must be set for this e2e test')
  const to = process.env.AUTH_EMAIL_TEST_TO ?? 'vihar@larza.ai'

  const res = await app.request('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      subject: 'Hello from Resend!',
      message: "Welcome! This email was sent using Resend's Node.js SDK.",
    }),
  })

  assert.equal(res.status, 200, await res.clone().text())
  const body = (await res.json()) as { success: boolean; id?: string }
  assert.equal(body.success, true)
  assert.ok(body.id, 'expected Resend email id')
})
