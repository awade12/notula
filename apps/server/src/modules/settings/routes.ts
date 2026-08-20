import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import type { Env } from '../../env'
import type { SessionVariables } from '../../middleware/session'
import {
  DEFAULT_EMBEDDING_OPTION,
  fetchOpenRouterModels,
  getPopularOpenRouterModels,
  testOpenRouterConnection,
} from '../ai/openrouter'
import { aiFeatureFlagsSchema } from '../ai/feature-flags'
import * as settingsService from './service'

const updateAiSettingsSchema = z.object({
  defaultModel: z.string().min(1).max(120).optional(),
  enableEmbeddings: z.boolean().optional(),
  apiKey: z.string().max(500).nullable().optional(),
  featureFlags: aiFeatureFlagsSchema.partial().optional(),
})

const updatePreferencesSchema = z.object({
  appearance: z.record(z.string(), z.unknown()).optional(),
  user: z.record(z.string(), z.unknown()).optional(),
})

export function createSettingsRoutes(db: Db, env: Env) {
  const app = new Hono<{ Variables: SessionVariables }>()

  app.get('/preferences', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const preferences = await settingsService.getUserPreferences(db, user.id)
    return c.json(preferences)
  })

  app.patch('/preferences', zValidator('json', updatePreferencesSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const preferences = await settingsService.updateUserPreferences(
      db,
      user.id,
      c.req.valid('json'),
    )
    return c.json(preferences)
  })

  app.get('/ai', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const settings = await settingsService.getAiSettings(db, user.id, env.BETTER_AUTH_SECRET)
    return c.json(settings)
  })

  app.patch('/ai', zValidator('json', updateAiSettingsSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = c.req.valid('json')
    const settings = await settingsService.updateAiSettings(db, user.id, env.BETTER_AUTH_SECRET, body)
    return c.json(settings)
  })

  app.delete('/ai/key', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const settings = await settingsService.updateAiSettings(db, user.id, env.BETTER_AUTH_SECRET, {
      apiKey: null,
    })
    return c.json(settings)
  })

  app.get('/ai/models', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const apiKey = await settingsService.getUserOpenRouterApiKey(
      db,
      user.id,
      env.BETTER_AUTH_SECRET,
    )

    if (!apiKey) {
      const models = await getPopularOpenRouterModels()
      return c.json({ models, embedding: DEFAULT_EMBEDDING_OPTION })
    }

    try {
      const models = await fetchOpenRouterModels(apiKey)
      return c.json({ models, embedding: DEFAULT_EMBEDDING_OPTION })
    } catch {
      const models = await getPopularOpenRouterModels()
      return c.json({ models, embedding: DEFAULT_EMBEDDING_OPTION })
    }
  })

  app.post('/ai/test', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const apiKey = await settingsService.getUserOpenRouterApiKey(
      db,
      user.id,
      env.BETTER_AUTH_SECRET,
    )

    if (!apiKey) {
      return c.json({ error: 'Add an OpenRouter API key first' }, 400)
    }

    const settings = await settingsService.getAiSettings(db, user.id, env.BETTER_AUTH_SECRET)

    try {
      await testOpenRouterConnection(apiKey, settings.defaultModel)
      return c.json({ ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed'
      return c.json({ error: message }, 400)
    }
  })

  return app
}
