/** @type {import('next').NextConfig} */
module.exports = {
  // 'standalone' is the portability switch: it produces a minimal self-contained
  // server that runs the SAME on your laptop, Railway, or your own Cloud Run / ECS
  // later. Not used by `next dev`, but it's what the production Dockerfile builds.
  output: 'standalone',

  // NOTE: the same-origin `/api/*` proxy lives in `middleware.ts`, NOT here.
  // `next.config.js` rewrites are evaluated at BUILD time and inline `process.env`,
  // so a runtime value like BACKEND_URL_INTERNAL can't be read from here. Middleware
  // runs per-request and DOES see runtime env, keeping the image environment-agnostic.
}
