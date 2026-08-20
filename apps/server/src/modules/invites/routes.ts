import { Hono } from 'hono'
import type { Db } from '../../db/client'
import type { SessionVariables } from '../../middleware/session'
import * as membersService from '../spaces/members.service'

export function createInvitesRoutes(db: Db) {
  const app = new Hono<{ Variables: SessionVariables }>()

  app.get('/:token', async (c) => {
    try {
      const invite = await membersService.getInvitePreview(db, c.req.param('token'))
      return c.json({ invite })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Invite not found or expired' }, 404)
      }
      throw error
    }
  })

  app.post('/:token/accept', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const result = await membersService.acceptSpaceInvite(db, c.req.param('token'), user.id)
      return c.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Invite not found or expired' }, 404)
      }
      throw error
    }
  })

  return app
}
