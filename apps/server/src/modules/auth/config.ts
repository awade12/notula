import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Db } from '../../db/client'
import type { Env } from '../../env'
import { resolveSharedCookieDomain } from '../../lib/cookie-domain'
import * as schema from '../../db/schema'

export function createAuth(db: Db, env: Env) {
  const cookieDomain = resolveSharedCookieDomain(env.WEB_ORIGIN, env.BETTER_AUTH_URL)
  const useSecureCookies = env.BETTER_AUTH_URL.startsWith('https://')

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.WEB_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    advanced: cookieDomain
      ? {
          useSecureCookies,
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
          defaultCookieAttributes: {
            sameSite: 'lax',
            secure: useSecureCookies,
            domain: cookieDomain,
          },
        }
      : useSecureCookies
        ? { useSecureCookies: true }
        : undefined,
  })
}

export type Auth = ReturnType<typeof createAuth>
