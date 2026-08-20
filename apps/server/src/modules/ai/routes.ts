import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import type { Env } from '../../env'
import type { SessionVariables } from '../../middleware/session'
import * as settingsService from '../settings/service'
import { buildCompletionMessages, AI_COMPLETION_TEMPLATES } from './completion.service'
import { runTaskAgent, taskAgentRequestSchema } from './task-agent.service'
import { streamChatCompletion } from './openrouter'

const completeSchema = z.object({
  prompt: z.string().min(1).max(8000),
  pageTitle: z.string().max(500).optional(),
  pageContext: z.string().max(32000).optional(),
  selection: z.string().max(8000).optional(),
  template: z.enum(AI_COMPLETION_TEMPLATES).optional(),
  model: z.string().min(1).max(120).optional(),
  maxTokens: z.number().int().min(8).max(4096).optional(),
})

export function createAiRoutes(db: Db, env: Env) {
  const app = new Hono<{ Variables: SessionVariables }>()

  app.post('/complete', zValidator('json', completeSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = c.req.valid('json')
    const apiKey = await settingsService.getUserOpenRouterApiKey(
      db,
      user.id,
      env.BETTER_AUTH_SECRET,
    )

    if (!apiKey) {
      return c.json({ error: 'Add an OpenRouter API key in Settings → AI' }, 400)
    }

    const settings = await settingsService.getAiSettings(db, user.id, env.BETTER_AUTH_SECRET)
    const model = body.model ?? settings.defaultModel
    const messages = buildCompletionMessages(body)

    try {
      const stream = await streamChatCompletion(
        apiKey,
        model,
        messages,
        c.req.raw.signal,
        body.maxTokens,
      )

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Completion failed'
      return c.json({ error: message }, 400)
    }
  })

  app.post('/task-agent', zValidator('json', taskAgentRequestSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = c.req.valid('json')
    const apiKey = await settingsService.getUserOpenRouterApiKey(
      db,
      user.id,
      env.BETTER_AUTH_SECRET,
    )

    if (!apiKey) {
      return c.json({ error: 'Add an OpenRouter API key in Settings → AI' }, 400)
    }

    const settings = await settingsService.getAiSettings(db, user.id, env.BETTER_AUTH_SECRET)
    const model = body.model ?? settings.defaultModel

    try {
      const result = await runTaskAgent(apiKey, model, body)
      return c.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task assistant failed'
      return c.json({ error: message }, 400)
    }
  })

  return app
}
