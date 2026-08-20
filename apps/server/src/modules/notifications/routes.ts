import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import { createRequireSpaceEditor } from '../../middleware/require-space-editor'
import {
  createRequireSpaceMember,
  type SpaceVariables,
} from '../../middleware/require-space-member'
import type { SessionVariables } from '../../middleware/session'
import * as notificationsService from './service'

const commentNotifySchema = z.object({
  pageId: z.string().min(1),
  pageTitle: z.string().max(200),
  recipientUserIds: z.array(z.string().min(1)).max(50),
})

export function createNotificationsRoutes(db: Db) {
  const app = new Hono<{ Variables: SessionVariables }>()

  app.get('/', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const items = await notificationsService.listNotifications(db, user.id)
    const unreadCount = await notificationsService.getUnreadNotificationCount(db, user.id)
    return c.json({ notifications: items, unreadCount })
  })

  app.post('/read-all', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    await notificationsService.markAllNotificationsRead(db, user.id)
    return c.json({ ok: true })
  })

  app.post('/:notificationId/read', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const result = await notificationsService.markNotificationRead(
        db,
        user.id,
        c.req.param('notificationId'),
      )
      return c.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  return app
}

export function createSpaceNotificationRoutes(db: Db) {
  const app = new Hono<{ Variables: SpaceVariables }>()
  const requireSpaceMember = createRequireSpaceMember(db)
  const requireSpaceEditor = createRequireSpaceEditor()

  app.use('*', requireSpaceMember)

  app.post('/comment', requireSpaceEditor, zValidator('json', commentNotifySchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = c.req.valid('json')
    const result = await notificationsService.createCommentNotifications(db, {
      actorId: user.id,
      spaceId: c.get('spaceId'),
      pageId: body.pageId,
      pageTitle: body.pageTitle,
      recipientUserIds: body.recipientUserIds,
    })

    return c.json(result, 201)
  })

  return app
}
