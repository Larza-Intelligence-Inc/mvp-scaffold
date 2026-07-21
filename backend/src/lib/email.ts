import { defaultFrom, getResend } from './resend'

export type AppEmail = {
  to: string | string[]
  subject: string
  html: string
  text: string
}

/**
 * Send transactional app email via Resend.
 * Throws if `RESEND_API_KEY` is missing or Resend returns an error.
 */
export async function sendAppEmail(message: AppEmail): Promise<{ id?: string }> {
  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: defaultFrom(),
    to: Array.isArray(message.to) ? message.to : [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
  if (error) {
    throw new Error(error.message)
  }
  return { id: data?.id }
}

/**
 * Fire-and-forget email for auth flows (avoids leaking timing via await).
 * Errors are logged; they do not reject the caller.
 */
export function sendAppEmailBackground(message: AppEmail): void {
  void sendAppEmail(message).catch((err) => {
    console.error('[email] failed to send', {
      to: message.to,
      subject: message.subject,
      error: err instanceof Error ? err.message : err,
    })
  })
}

/**
 * Rewrite Better Auth links (BETTER_AUTH_URL) to the browser-facing origin
 * so users hit the Next.js `/api/*` proxy instead of the raw API host.
 */
export function publicAuthLink(url: string, frontendOrigin: string): string {
  try {
    const parsed = new URL(url)
    return `${frontendOrigin.replace(/\/$/, '')}${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}
