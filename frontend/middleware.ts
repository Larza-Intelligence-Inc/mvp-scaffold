import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Same-origin API proxy. The browser only ever calls `/api/*` on its OWN origin;
// this middleware forwards those requests server-side to the backend. Unlike
// `next.config.js` rewrites (which bake env vars at build time), middleware runs
// per-request and reads BACKEND_URL_INTERNAL at RUNTIME — so one frontend image
// runs unchanged in local, cloud, PR, staging and prod, configured purely at runtime.
export function middleware(request: NextRequest) {
  const backend = process.env.BACKEND_URL_INTERNAL ?? 'http://localhost:3001'
  const target = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    backend,
  )
  return NextResponse.rewrite(target, { request })
}

export const config = {
  matcher: ['/api/:path*'],
}
