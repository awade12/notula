import { loadEnv } from '../src/env.ts'

try {
  const env = loadEnv()
  console.log(`[server] BETTER_AUTH_URL=${env.BETTER_AUTH_URL}`)
  console.log(`[server] WEB_ORIGIN=${env.WEB_ORIGIN}`)
  console.log(`[server] PORT=${env.PORT}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[server] Environment validation failed: ${message}`)
  process.exit(1)
}
