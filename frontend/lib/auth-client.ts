import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, organizationClient } from 'better-auth/client/plugins'
import { passkeyClient } from '@better-auth/passkey/client'
import { ac, roles } from '@/lib/auth-permissions'

// No baseURL: the client infers the current origin in the browser and calls
// `/api/auth/*`, which the Next.js rewrite proxies to the backend. Frontend and
// API are same-origin from the browser's perspective, so cookies just work.
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles,
      teams: { enabled: true },
      dynamicAccessControl: { enabled: true },
    }),
    magicLinkClient(),
    passkeyClient(),
  ],
})

export function appOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

/** Safe relative next-path from `?next=` query params. */
export function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}
