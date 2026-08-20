import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import { spaceMembers, spaces } from '../../db/schema/spaces'
import type { SessionVariables } from '../../middleware/session'

const createSpaceSchema = z.object({
  name: z.string().min(1).max(100),
})

export function createSpacesRoutes(db: Db) {
  const app = new Hono<{ Variables: SessionVariables }>()

  app.get('/', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const rows = await db
      .select({
        id: spaces.id,
        name: spaces.name,
        slug: spaces.slug,
        role: spaceMembers.role,
        createdAt: spaces.createdAt,
      })
      .from(spaceMembers)
      .innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
      .where(eq(spaceMembers.userId, user.id))

    return c.json({ spaces: rows })
  })

  app.post('/', zValidator('json', createSpaceSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { name } = c.req.valid('json')
    const id = randomUUID()
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || id.slice(0, 8)

    await db.insert(spaces).values({
      id,
      name,
      slug: `${slug}-${id.slice(0, 6)}`,
      ownerId: user.id,
    })

    await db.insert(spaceMembers).values({
      id: randomUUID(),
      spaceId: id,
      userId: user.id,
      role: 'owner',
    })

    return c.json({ id, name, slug }, 201)
  })

  return app
}
