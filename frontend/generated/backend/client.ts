import createClient from 'openapi-fetch'
import type { paths } from './schema'

const DEFAULT_BASE_URL = 'http://localhost:3001'

export function createBackendClient(baseUrl: string) {
  return createClient<paths>({ baseUrl, credentials: 'include' })
}

/** Server Components / Route Handlers — prefer the Docker/private network URL. */
export function getServerBackendClient() {
  const baseUrl =
    process.env.BACKEND_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL
  return createBackendClient(baseUrl)
}

/** Browser / Client Components — public API origin only. */
export function getBrowserBackendClient() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL
  return createBackendClient(baseUrl)
}
