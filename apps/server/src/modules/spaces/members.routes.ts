import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import {
  createRequireSpaceMember,
  type SpaceVariables,
} from '../../middleware/require-space-member'
import { spaceRoleSchema } from './roles'
import * as membersService from './members.service'

const updateRoleSchema = z.object({
  role: z.enum(spaceRoleSchema),
})

const createInviteSchema = z.object({
  role: z.enum(['editor', 'viewer'] as const),
  email: z.string().email().optional().nullable(),
})

export function createMembersRoutes(db: Db) {
  const app = new Hono<{ Variables: SpaceVariables }>()
  const requireSpaceMember = createRequireSpaceMember(db)

  app.use('*', requireSpaceMember)

  app.get('/', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const members = await membersService.listSpaceMembers(db, c.get('spaceId'), user.id)
      return c.json({ members })
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }
  })

  app.patch('/:memberId', zValidator('json', updateRoleSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const result = await membersService.updateMemberRole(
        db,
        c.get('spaceId'),
        user.id,
        c.req.param('memberId'),
        c.req.valid('json').role,
      )
      return c.json(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403)
        if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
        if (error.message.includes('owner')) return c.json({ error: error.message }, 400)
      }
      throw error
    }
  })

  app.delete('/:memberId', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const result = await membersService.removeMember(
        db,
        c.get('spaceId'),
        user.id,
        c.req.param('memberId'),
      )
      return c.json(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403)
        if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
        if (error.message.includes('owner')) return c.json({ error: error.message }, 400)
      }
      throw error
    }
  })

  app.get('/invites', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const invites = await membersService.listSpaceInvites(db, c.get('spaceId'), user.id)
      return c.json({ invites })
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }
  })

  app.post('/invites', zValidator('json', createInviteSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const invite = await membersService.createSpaceInvite(
        db,
        c.get('spaceId'),
        user.id,
        c.req.valid('json'),
      )
      return c.json(invite, 201)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403)
        if (error.message.includes('owner')) return c.json({ error: error.message }, 400)
      }
      throw error
    }
  })

  app.delete('/invites/:inviteId', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const result = await membersService.revokeSpaceInvite(
        db,
        c.get('spaceId'),
        user.id,
        c.req.param('inviteId'),
      )
      return c.json(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Forbidden') return c.json({ error: 'Forbidden' }, 403)
        if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  return app
}
