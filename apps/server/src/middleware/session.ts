import type { Context, Next } from 'hono'
import type { Auth } from '../modules/auth/config'

export type SessionVariables = {
  user: Auth['$Infer']['Session']['user'] | null
  session: Auth['$Infer']['Session']['session'] | null
}

export function createSessionMiddleware(auth: Auth) {
  return async (c: Context, next: Next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      c.set('user', null)
      c.set('session', null)
      await next()
      return
    }

    c.set('user', session.user)
    c.set('session', session.session)
    await next()
  }
}

export function requireAuth(c: Context): asserts c is Context & {
  var: SessionVariables & { user: NonNullable<SessionVariables['user']> }
} {
  const user = c.get('user')
  if (!user) {
    throw new Error('Unauthorized')
  }
}
