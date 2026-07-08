/** @type {import('next').NextConfig} */
module.exports = {
  // 'standalone' is the portability switch: it produces a minimal self-contained
  // server that runs the SAME on your laptop, Railway, or your own Cloud Run / ECS
  // later. Not used by `next dev`, but it's what the production Dockerfile builds.
  output: 'standalone',
}
