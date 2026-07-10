/**
 * Emit backend/openapi.json from the Hono app without starting a server.
 * Run: npm run openapi:emit
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from '../src/app'
import { openApiConfig } from '../src/openapi-config'

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'openapi.json')
const document = app.getOpenAPIDocument(openApiConfig)

writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outPath}`)
