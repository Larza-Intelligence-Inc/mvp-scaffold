import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const authClient = createAuthClient({
  baseURL,
  plugins: [organizationClient()],
})

export function appOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
