import { Resend } from 'resend'

/** Shared Resend client. Requires `RESEND_API_KEY` at process start. */
export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(apiKey)
}

export const defaultFrom = () =>
  process.env.EMAIL_FROM ?? 'Acme <onboarding@resend.dev>'
