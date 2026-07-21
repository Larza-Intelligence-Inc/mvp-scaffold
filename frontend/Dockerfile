# Production image for Next.js using the standalone output (~100-200MB).
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# The browser only calls `/api/*` on its own origin (proxied to the backend via
# next.config.js rewrites using the runtime BACKEND_URL_INTERNAL), so there is no
# build-time API URL to inline. This image is environment-agnostic.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
