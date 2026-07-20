# Production image for the Hono API (used by Railway / your own cloud).
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
# Apply DB migrations, then start. drizzle-kit + tsx are present in the image.
CMD ["sh", "-c", "npm run db:migrate && npm run start:prod"]
