import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import type { Env } from '../../env'
import { createRequireSpaceMember, type SpaceVariables } from '../../middleware/require-space-member'
import * as searchService from './service'

const searchQuerySchema = z.object({
  q: z.string().max(200),
  mode: z.enum(['keyword', 'semantic', 'hybrid']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  scope: z.enum(['all', 'notes', 'folders']).optional(),
})

export function createSearchRoutes(db: Db, env: Env) {
  const app = new Hono<{ Variables: SpaceVariables }>()
  const requireSpaceMember = createRequireSpaceMember(db)

  app.use('*', requireSpaceMember)

  app.get('/', zValidator('query', searchQuerySchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { q, mode, limit, scope } = c.req.valid('query')
    const results = await searchService.searchPages(db, c.get('spaceId'), user.id, q, {
      mode,
      limit,
      scope,
      authSecret: env.BETTER_AUTH_SECRET,
    })
    return c.json({ results })
  })

  return app
}
