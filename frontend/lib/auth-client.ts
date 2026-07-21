import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

// No baseURL: the client infers the current origin in the browser and calls
// `/api/auth/*`, which the Next.js rewrite proxies to the backend. Frontend and
// API are same-origin from the browser's perspective, so cookies just work.
export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

export function appOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}
