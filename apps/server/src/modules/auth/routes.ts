import { Hono } from 'hono'
import type { Auth } from './config'

export function createAuthRoutes(auth: Auth) {
  const app = new Hono()

  app.on(['POST', 'GET'], '/*', (c) => auth.handler(c.req.raw))

  return app
}
