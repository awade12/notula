import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Hocuspocus } from '@hocuspocus/server'
import {
  databaseSchemaSchema,
  databaseViewConfigSchema,
  filterRuleSchema,
  sortRuleSchema,
} from '@notesapp/shared'
import type { Db } from '../../db/client'
import { broadcastDatabaseChanged } from '../../collab/broadcast'
import {
  createRequireSpaceMember,
  type SpaceVariables,
} from '../../middleware/require-space-member'
import { createRequireSpaceEditor } from '../../middleware/require-space-editor'
import * as schemaService from './schema.service'
import * as databasesService from './service'
import * as viewsService from './views.service'
import * as publicBoardsService from '../public-boards/service'

const createRowSchema = z.object({
  properties: z.record(z.string(), z.unknown()).optional(),
})

const createDatabaseSchema = z.object({
  title: z.string().max(200).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().max(32).nullable().optional(),
  schema: databaseSchemaSchema.optional(),
  isProjectBoard: z.boolean().optional(),
})

const updateDatabaseSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(32).nullable().optional(),
})

const updateBoardPublicSchema = z.object({
  isPublic: z.boolean().optional(),
  publicSlug: z.string().max(64).nullable().optional(),
})

const updateCellSchema = z.object({
  propertyId: z.string().min(1).max(64),
  value: z.unknown(),
})

const reorderRowSchema = z.object({
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
})

const moveKanbanRowSchema = z.object({
  statusPropertyId: z.string().min(1).max(64).optional(),
  statusValue: z.unknown().optional(),
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
})

const updateSchemaBody = z.object({
  schema: databaseSchemaSchema,
})

const createViewBody = z.object({
  type: z.enum(['table', 'board']),
  title: z.string().max(100).optional(),
  groupByPropertyId: z.string().nullable().optional(),
})

const updateViewBody = z.object({
  title: z.string().max(100).optional(),
  config: databaseViewConfigSchema.optional(),
})

export function createDatabasesRoutes(db: Db, collab: Hocuspocus) {
  const app = new Hono<{ Variables: SpaceVariables }>()
  const requireSpaceMember = createRequireSpaceMember(db)
  const requireSpaceEditor = createRequireSpaceEditor()

  app.use('*', requireSpaceMember)

  app.get('/', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const parentIdParam = c.req.query('parentId')
    const projectBoards = c.req.query('projectBoards') === 'true'
    const parentId =
      parentIdParam === undefined
        ? undefined
        : parentIdParam === 'null' || parentIdParam === ''
          ? null
          : parentIdParam

    const items = await databasesService.listDatabases(
      db,
      c.get('spaceId'),
      user.id,
      { parentId, projectBoards: projectBoards || undefined },
    )

    return c.json({ databases: items })
  })

  app.post('/', requireSpaceEditor, zValidator('json', createDatabaseSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const database = await databasesService.createDatabase(
        db,
        c.get('spaceId'),
        user.id,
        c.req.valid('json'),
      )
      return c.json({ database }, 201)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid parent') return c.json({ error: error.message }, 400)
        if (error.message === 'Databases can only live inside folders') {
          return c.json({ error: error.message }, 400)
        }
      }
      throw error
    }
  })

  app.get('/:databaseId', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const database = await databasesService.getDatabase(
        db,
        c.get('spaceId'),
        c.req.param('databaseId'),
        user.id,
      )
      return c.json({ database })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.patch('/:databaseId', requireSpaceEditor, zValidator('json', updateDatabaseSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const database = await databasesService.updateDatabase(
        db,
        c.get('spaceId'),
        c.req.param('databaseId'),
        user.id,
        c.req.valid('json'),
      )
      return c.json({ database })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.patch(
    '/:databaseId/public',
    requireSpaceEditor,
    zValidator('json', updateBoardPublicSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      try {
        const settings = await publicBoardsService.updateBoardPublicSettings(
          db,
          c.get('spaceId'),
          c.req.param('databaseId'),
          c.req.valid('json'),
        )
        return c.json({ settings })
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
          return c.json({ error: error.message }, 400)
        }
        throw error
      }
    },
  )

  app.patch(
    '/:databaseId/schema',
    requireSpaceEditor,
    zValidator('json', updateSchemaBody),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      try {
        const database = await schemaService.updateDatabaseSchema(
          db,
          c.get('spaceId'),
          c.req.param('databaseId'),
          user.id,
          c.req.valid('json'),
        )
        broadcastDatabaseChanged(collab, c.req.param('databaseId'), 'schema')
        return c.json({ database })
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
          if (error.message === 'Duplicate property ids') {
            return c.json({ error: error.message }, 400)
          }
        }
        throw error
      }
    },
  )

  app.post('/:databaseId/views', requireSpaceEditor, zValidator('json', createViewBody), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const database = await viewsService.createView(
        db,
        c.get('spaceId'),
        c.req.param('databaseId'),
        user.id,
        c.req.valid('json'),
      )
      broadcastDatabaseChanged(collab, c.req.param('databaseId'), 'view')
      return c.json({ database }, 201)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
        if (
          error.message === 'Board view requires a select property' ||
          error.message === 'Invalid group property'
        ) {
          return c.json({ error: error.message }, 400)
        }
      }
      throw error
    }
  })

  app.patch(
    '/:databaseId/views/:viewId',
    requireSpaceEditor,
    zValidator('json', updateViewBody),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      try {
        const database = await viewsService.updateView(
          db,
          c.get('spaceId'),
          c.req.param('databaseId'),
          c.req.param('viewId'),
          user.id,
          c.req.valid('json'),
        )
        broadcastDatabaseChanged(collab, c.req.param('databaseId'), 'view')
        return c.json({ database })
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not found' || error.message === 'View not found') {
            return c.json({ error: 'Not found' }, 404)
          }
          if (
            error.message === 'Invalid group property' ||
            error.message === 'Invalid property in view'
          ) {
            return c.json({ error: error.message }, 400)
          }
        }
        throw error
      }
    },
  )

  app.delete('/:databaseId', requireSpaceEditor, async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const databaseId = c.req.param('databaseId')
    if (!databaseId) return c.json({ error: 'Not found' }, 404)

    try {
      const result = await databasesService.deleteDatabase(
        db,
        c.get('spaceId'),
        databaseId,
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

  app.get('/:databaseId/rows', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    let filters: z.infer<typeof filterRuleSchema>[] | undefined
    let sorts: z.infer<typeof sortRuleSchema>[] | undefined

    const filtersRaw = c.req.query('filters')
    const sortsRaw = c.req.query('sorts')

    if (filtersRaw) {
      try {
        const parsed = JSON.parse(filtersRaw)
        filters = z.array(filterRuleSchema).parse(parsed)
      } catch {
        return c.json({ error: 'Invalid filters' }, 400)
      }
    }

    if (sortsRaw) {
      try {
        const parsed = JSON.parse(sortsRaw)
        sorts = z.array(sortRuleSchema).parse(parsed)
      } catch {
        return c.json({ error: 'Invalid sorts' }, 400)
      }
    }

    const limit = c.req.query('limit') ? Number(c.req.query('limit')) : undefined
    const offset = c.req.query('offset') ? Number(c.req.query('offset')) : undefined

    try {
      const result = await databasesService.listRows(
        db,
        c.get('spaceId'),
        c.req.param('databaseId'),
        user.id,
        { filters, sorts, limit, offset },
      )
      return c.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.post('/:databaseId/rows', requireSpaceEditor, zValidator('json', createRowSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const databaseId = c.req.param('databaseId')
    if (!databaseId) return c.json({ error: 'Not found' }, 404)

    const body = c.req.valid('json')

    try {
      const row = await databasesService.createRowWithBroadcast(
        db,
        collab,
        c.get('spaceId'),
        databaseId,
        user.id,
        body,
      )
      return c.json({ row }, 201)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      throw error
    }
  })

  app.patch(
    '/:databaseId/rows/:rowId/cells',
    requireSpaceEditor,
    zValidator('json', updateCellSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      try {
        const result = await databasesService.updateRowCellWithBroadcast(
          db,
          collab,
          c.get('spaceId'),
          c.req.param('databaseId'),
          c.req.param('rowId'),
          user.id,
          c.req.valid('json'),
        )
        return c.json(result)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
          if (error.message === 'Invalid property') {
            return c.json({ error: error.message }, 400)
          }
          if (error.message.startsWith('Invalid ')) {
            return c.json({ error: error.message }, 400)
          }
        }
        throw error
      }
    },
  )

  app.patch(
    '/:databaseId/rows/:rowId/move',
    requireSpaceEditor,
    zValidator('json', moveKanbanRowSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      const databaseId = c.req.param('databaseId')
      const rowId = c.req.param('rowId')
      const spaceId = c.get('spaceId')
      if (!databaseId || !rowId || !spaceId) return c.json({ error: 'Not found' }, 404)

      try {
        const result = await databasesService.moveKanbanRowWithBroadcast(
          db,
          collab,
          spaceId,
          databaseId,
          rowId,
          user.id,
          c.req.valid('json'),
        )
        return c.json(result)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
          if (error.message === 'Invalid property') {
            return c.json({ error: error.message }, 400)
          }
          if (error.message.startsWith('Invalid ')) {
            return c.json({ error: error.message }, 400)
          }
        }
        throw error
      }
    },
  )

  app.patch(
    '/:databaseId/rows/:rowId/reorder',
    requireSpaceEditor,
    zValidator('json', reorderRowSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) return c.json({ error: 'Unauthorized' }, 401)

      const databaseId = c.req.param('databaseId')
      const rowId = c.req.param('rowId')
      const spaceId = c.get('spaceId')
      if (!databaseId || !rowId || !spaceId) return c.json({ error: 'Not found' }, 404)

      try {
        const result = await databasesService.reorderRow(
          db,
          spaceId,
          databaseId,
          rowId,
          user.id,
          c.req.valid('json'),
        )
        return c.json(result)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not found') return c.json({ error: 'Not found' }, 404)
          if (error.message.startsWith('Invalid ')) {
            return c.json({ error: error.message }, 400)
          }
        }
        throw error
      }
    },
  )

  app.delete('/:databaseId/rows/:rowId', requireSpaceEditor, async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const databaseId = c.req.param('databaseId')
    const rowId = c.req.param('rowId')
    const spaceId = c.get('spaceId')
    if (!databaseId || !rowId || !spaceId) return c.json({ error: 'Not found' }, 404)

    try {
      const result = await databasesService.deleteRowWithBroadcast(
        db,
        collab,
        spaceId,
        databaseId,
        rowId,
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
