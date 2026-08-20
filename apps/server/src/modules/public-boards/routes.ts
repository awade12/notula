import { Hono } from 'hono'
import type { Db } from '../../db/client'
import * as publicBoardsService from './service'

export function createPublicBoardsRoutes(db: Db) {
  const app = new Hono()

  app.get('/boards/:slug', async (c) => {
    try {
      const payload = await publicBoardsService.getPublicBoardBySlug(db, c.req.param('slug'))
      return c.json(payload)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Board not found' }, 404)
      }
      throw error
    }
  })

  return app
}
