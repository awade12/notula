import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { Hocuspocus } from '@hocuspocus/server'
import { z } from 'zod'
import type { Db } from '../../db/client'
import { createRequireSpaceEditor } from '../../middleware/require-space-editor'
import {
  createRequireSpaceMember,
  type SpaceVariables,
} from '../../middleware/require-space-member'
import type { SessionVariables } from '../../middleware/session'
import { INSIGHT_STATUSES } from './service'
import * as insightsService from './service'

const insightStatusSchema = z.enum(INSIGHT_STATUSES)

export function createInsightsRoutes(db: Db, collab: Hocuspocus) {
  const app = new Hono<{ Variables: SessionVariables }>()
  const requireSpaceMember = createRequireSpaceMember(db)
  const requireSpaceEditor = createRequireSpaceEditor()
  const spaceApp = new Hono<{ Variables: SpaceVariables }>()

  spaceApp.use('*', requireSpaceMember)

  app.get('/today', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    return c.json(await insightsService.getToday(db, user.id))
  })

  spaceApp.get('/options', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    return c.json(
      await insightsService.listInsightOptions(
        db,
        c.get('spaceId'),
        user.id,
      ),
    )
  })

  spaceApp.patch(
    '/items/:insightId',
    requireSpaceEditor,
    zValidator(
      'json',
      z.object({
        status: insightStatusSchema.optional(),
        dueDate: z.string().max(20).optional(),
      }),
    ),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      try {
        await insightsService.updateInsight(
          db,
          collab,
          c.get('spaceId'),
          c.req.param('insightId'),
          user.id,
          c.req.valid('json'),
        )
        return c.json({ ok: true })
      } catch (error) {
        if (error instanceof Error && error.message === 'Not found') {
          return c.json({ error: 'Not found' }, 404)
        }
        return c.json({ error: 'Forbidden' }, 403)
      }
    },
  )

  app.route('/spaces/:spaceId', spaceApp)

  return app
}
