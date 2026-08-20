import { z } from 'zod'
import { applyDatabaseUrlFromEnv } from './database-url.js'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  PORT: z.coerce.number().default(3001),
})

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizePublicUrl(raw: string): string {
  let value = raw.trim()
  if (value.startsWith('//')) {
    value = `https:${value}`
  } else if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }
  return value
}

function resolvePublicUrl(...candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    const value = emptyToUndefined(candidate)
    if (!value) continue
    const normalized = normalizePublicUrl(value)
    try {
      new URL(normalized)
      return normalized
    } catch {
      continue
    }
  }
  return undefined
}

function resolveAuthSecret(): string | undefined {
  return (
    emptyToUndefined(process.env.BETTER_AUTH_SECRET) ??
    emptyToUndefined(process.env.SERVICE_REALBASE64_AUTH)
  )
}

export type Env = z.infer<typeof envSchema>

export function loadEnv(): Env {
  applyDatabaseUrlFromEnv()

  const authUrl = resolvePublicUrl(
    process.env.BETTER_AUTH_URL,
    process.env.SERVICE_URL_SERVER,
    emptyToUndefined(process.env.SERVICE_FQDN_SERVER_3001)
      ? normalizePublicUrl(process.env.SERVICE_FQDN_SERVER_3001)
      : undefined,
    process.env.COOLIFY_URL,
    emptyToUndefined(process.env.COOLIFY_FQDN)
      ? normalizePublicUrl(process.env.COOLIFY_FQDN)
      : undefined,
  )

  const webOrigin = resolvePublicUrl(
    process.env.WEB_ORIGIN,
    process.env.SERVICE_URL_WEB,
    emptyToUndefined(process.env.SERVICE_FQDN_WEB_3000)
      ? normalizePublicUrl(process.env.SERVICE_FQDN_WEB_3000)
      : undefined,
    process.env.COOLIFY_URL,
    emptyToUndefined(process.env.COOLIFY_FQDN)
      ? normalizePublicUrl(process.env.COOLIFY_FQDN)
      : undefined,
  )

  const parsed = envSchema.safeParse({
    DATABASE_URL: emptyToUndefined(process.env.DATABASE_URL),
    BETTER_AUTH_SECRET: resolveAuthSecret(),
    BETTER_AUTH_URL: authUrl,
    WEB_ORIGIN: webOrigin,
    PORT: process.env.PORT,
  })

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid server environment: ${details}`)
  }

  return parsed.data
}
