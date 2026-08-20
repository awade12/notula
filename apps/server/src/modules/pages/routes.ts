import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import type { Env } from '../../env'
import { createRequireSpaceEditor } from '../../middleware/require-space-editor'
import { createRequireSpaceMember, type SpaceVariables } from '../../middleware/require-space-member'
import * as pagesService from './service'

const createPageSchema = z.object({
  title: z.string().max(200).optional(),
  parentId: z.string().nullable().optional(),
  kind: z.enum(['note', 'folder']).optional(),
})

const updatePageSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(32).nullable().optional(),
  kind: z.enum(['note', 'folder']).optional(),
})

const movePageSchema = z.object({
  parentId: z.string().nullable().optional(),
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
})

const reorderPageSchema = z.object({
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
})

export function createPagesRoutes(db: Db, env: Env) {
  const app = new Hono<{ Variables: SpaceVariables }>()
  const requireSpaceMember = createRequireSpaceMember(db)
  const requireSpaceEditor = createRequireSpaceEditor()

  app.use('*', requireSpaceMember)

  app.get('/', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const pages = await pagesService.listPages(db, c.get('spaceId'), user.id)
    return c.json({ pages })
  })

  app.post('/', requireSpaceEditor, zValidator('json', createPageSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const body = c.req.valid('json')
      const page = await pagesService.createPage(db, c.get('spaceId'), user.id, body)
      return c.json(page, 201)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid parent') {
          return c.json({ error: 'Invalid parent' }, 400)
        }
        if (error.message === 'Pages can only be nested inside folders') {
          return c.json({ error: error.message }, 400)
        }
      }
      throw error
    }
  })

  app.get('/:pageId/bootstrap', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const bootstrap = await pagesService.getPageBootstrap(
        db,
        c.get('spaceId'),
        c.req.param('pageId'),
        user.id,
      )
      return c.json({ bootstrap })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.get('/:pageId', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const page = await pagesService.getPage(db, c.get('spaceId'), c.req.param('pageId'), user.id)
      return c.json({ page })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.get('/:pageId/ai-insights', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const { getPageAiInsights } = await import('../ai/page-insights.service')
      const insights = await getPageAiInsights(
        db,
        c.get('spaceId'),
        c.req.param('pageId'),
        user.id,
        env.BETTER_AUTH_SECRET,
      )
      return c.json(insights)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.get('/:pageId/preview', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const preview = await pagesService.getPagePreview(
        db,
        c.get('spaceId'),
        c.req.param('pageId'),
        user.id,
      )
      return c.json({ preview })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.get('/:pageId/backlinks', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const backlinks = await pagesService.getBacklinks(
        db,
        c.get('spaceId'),
        c.req.param('pageId'),
        user.id,
      )
      return c.json({ backlinks })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.patch('/:pageId', requireSpaceEditor, zValidator('json', updatePageSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const page = await pagesService.updatePage(
        db,
        c.get('spaceId'),
        c.req.param('pageId'),
        user.id,
        c.req.valid('json'),
      )
      return c.json({ page })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
        if (error.message === 'Move or delete items before converting to a note') {
          return c.json({ error: error.message }, 400)
        }
      }
      throw error
    }
  })

  app.patch('/:pageId/move', requireSpaceEditor, zValidator('json', movePageSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const body = c.req.valid('json')
      const pageId = c.req.param('pageId')
      const spaceId = c.get('spaceId')

      const page = body.parentId !== undefined
        ? await pagesService.movePage(db, spaceId, pageId, user.id, {
            parentId: body.parentId,
            beforeId: body.beforeId,
            afterId: body.afterId,
          })
        : await pagesService.reorderPageAmongSiblings(db, spaceId, pageId, user.id, {
            beforeId: body.beforeId,
            afterId: body.afterId,
          })

      return c.json({ page })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
        if (error.message === 'Invalid parent') return c.json({ error: 'Invalid parent' }, 400)
        if (error.message === 'Cannot move page into itself') {
          return c.json({ error: error.message }, 400)
        }
        if (error.message === 'Cannot move page into its descendant') {
          return c.json({ error: error.message }, 400)
        }
        if (error.message === 'Pages can only be nested inside folders') {
          return c.json({ error: error.message }, 400)
        }
      }
      throw error
    }
  })

  app.patch('/:pageId/reorder', requireSpaceEditor, zValidator('json', reorderPageSchema), async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const page = await pagesService.reorderPageAmongSiblings(
        db,
        c.get('spaceId'),
        c.req.param('pageId'),
        user.id,
        c.req.valid('json'),
      )
      return c.json({ page })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.delete('/:pageId', requireSpaceEditor, async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const pageId = c.req.param('pageId')
    if (!pageId) {
      return c.json({ error: 'Not found' }, 404)
    }

    try {
      const result = await pagesService.deletePage(
        db,
        c.get('spaceId'),
        pageId,
        user.id,
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
