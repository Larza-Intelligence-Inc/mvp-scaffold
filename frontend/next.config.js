/** @type {import('next').NextConfig} */
module.exports = {
  // 'standalone' is the portability switch: it produces a minimal self-contained
  // server that runs the SAME on your laptop, Railway, or your own Cloud Run / ECS
  // later. Not used by `next dev`, but it's what the production Dockerfile builds.
  output: 'standalone',

  // Same-origin API proxy. The browser only ever calls `/api/*` on its OWN origin;
  // Next forwards those requests server-side to the backend at BACKEND_URL_INTERNAL.
  // This is evaluated at server startup (runtime), so no API URL is baked into the
  // build — one frontend image runs unchanged in local, cloud, PR, staging and prod.
  async rewrites() {
    const backend = process.env.BACKEND_URL_INTERNAL ?? 'http://localhost:3001'
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }]
  },
}
