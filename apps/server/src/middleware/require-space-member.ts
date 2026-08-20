import type { Context, Next } from 'hono'
import type { Db } from '../db/client'
import { requireSpaceMembership } from '../modules/spaces/permissions'
import type { SessionVariables } from './session'

export type SpaceVariables = SessionVariables & {
  spaceId: string
  memberRole: string
}

export function createRequireSpaceMember(db: Db) {
  return async (c: Context<{ Variables: SpaceVariables }>, next: Next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const spaceId = c.req.param('spaceId')
    if (!spaceId) {
      return c.json({ error: 'Space not found' }, 404)
    }

    try {
      const membership = await requireSpaceMembership(db, spaceId, user.id)
      c.set('spaceId', spaceId)
      c.set('memberRole', membership.role)
      return next()
    } catch {
      return c.json({ error: 'Forbidden' }, 403)
    }
  }
}
