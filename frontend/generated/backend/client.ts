import createClient from 'openapi-fetch'
import type { paths } from './schema'

const DEFAULT_BASE_URL = 'http://localhost:3001'

export function createBackendClient(baseUrl: string) {
  return createClient<paths>({ baseUrl, credentials: 'include' })
}

/** Server Components / Route Handlers — reach the backend directly over the
 * private network (Docker service DNS locally, Railway private domain in prod). */
export function getServerBackendClient() {
  const baseUrl = process.env.BACKEND_URL_INTERNAL ?? DEFAULT_BASE_URL
  return createBackendClient(baseUrl)
}

/** Browser / Client Components — call the SAME origin. `/api/*` is proxied to the
 * backend by the Next.js rewrite, so no public API URL is baked into the build. */
export function getBrowserBackendClient() {
  return createBackendClient('')
}
