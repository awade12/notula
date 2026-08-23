import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from '../../db/client'
import type { Env } from '../../env'
import type { SessionVariables } from '../../middleware/session'
import { requireSpaceMembership } from '../spaces/permissions'
import * as settingsService from '../settings/service'
import { buildCompletionMessages, AI_COMPLETION_TEMPLATES } from './completion.service'
import { buildRetrievalQuery, retrieveAiWorkspaceContext } from './retrieval'
import { isLaunchBlockerQuery } from './retrieval-query'
import { hydrateTaskAgentRequest } from './build-task-agent-context'
import { runTaskAgent, taskAgentRequestSchema, taskAiPropertySchema } from './task-agent.service'
import {
  buildTeamspaceChatMessages,
  teamspaceChatRequestSchema,
} from './teamspace-chat.service'
import { prependWorkspaceMetaToStream } from './teamspace-chat-stream'
import { streamChatCompletion } from './openrouter'
import {
  loadExplicitAiContextRefs,
  mergeExplicitContextIntoWorkspace,
} from './load-explicit-ai-context'
import { parseBoardFilterFromPrompt } from './board-filter.service'
import { getSpaceAiDigest } from './space-digest.service'
import * as aiThreadsService from './ai-threads.service'
import { breakSpecIntoTasks } from './spec-to-tasks.service'
import * as databasesService from '../databases/service'
import { pages } from '../../db/schema/pages'
import { eq } from 'drizzle-orm'

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
})

const aiContextRefSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('note'), id: z.string().min(1).max(64) }),
  z.object({
    type: z.literal('task'),
    id: z.string().min(1).max(64),
    boardId: z.string().min(1).max(64),
  }),
])

const completeSchema = z.object({
  prompt: z.string().min(1).max(8000),
  spaceId: z.string().min(1).max(64).optional(),
  pageId: z.string().min(1).max(64).optional(),
  includeWorkspaceContext: z.boolean().optional(),
  pageTitle: z.string().max(500).optional(),
  pageContext: z.string().max(32000).optional(),
  selection: z.string().max(8000).optional(),
  template: z.enum(AI_COMPLETION_TEMPLATES).optional(),
  model: z.string().min(1).max(120).optional(),
  maxTokens: z.number().int().min(8).max(4096).optional(),
  messages: z.array(chatMessageSchema).max(20).optional(),
  contextRefs: z.array(aiContextRefSchema).max(8).optional(),
})

const parseBoardFilterSchema = z.object({
  spaceId: z.string().min(1).max(64),
  prompt: z.string().min(1).max(500),
  properties: z.array(taskAiPropertySchema).min(1).max(30),
  model: z.string().min(1).max(120).optional(),
})

const aiThreadMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(16000),
  citations: z.array(z.unknown()).optional(),
})

const syncAiThreadsSchema = z.object({
  spaceId: z.string().min(1).max(64),
  scopeType: z.enum(['page', 'task', 'teamspace']),
  scopeId: z.string().min(1).max(64),
  activeThreadId: z.string().min(1).max(64),
  threads: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        title: z.string().max(200),
        messages: z.array(aiThreadMessageSchema).max(40),
        createdAt: z.number().optional(),
        updatedAt: z.number().optional(),
      }),
    )
    .max(40),
})

const specToTasksSchema = z.object({
  spaceId: z.string().min(1).max(64),
  pageId: z.string().min(1).max(64),
  boardId: z.string().min(1).max(64),
  create: z.boolean().optional(),
  model: z.string().min(1).max(120).optional(),
})

async function loadWorkspaceContextForCompletion(
  db: Db,
  env: Env,
  userId: string,
  body: z.infer<typeof completeSchema>,
) {
  if (!body.spaceId || body.template === 'ghost' || body.includeWorkspaceContext === false) {
    return null
  }

  try {
    return await retrieveAiWorkspaceContext(db, {
      spaceId: body.spaceId,
      userId,
      query: buildRetrievalQuery([
        body.prompt,
        body.pageTitle,
        body.selection,
        body.pageContext?.slice(0, 1200),
        ...(body.messages ?? []).slice(-4).map((message) => message.content),
      ]),
      excludePageId: body.pageId,
      authSecret: env.BETTER_AUTH_SECRET,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      throw error
    }
    return null
  }
}

async function loadWorkspaceContextForTaskAgent(
  db: Db,
  env: Env,
  userId: string,
  body: z.infer<typeof taskAgentRequestSchema>,
) {
  if (!body.spaceId) return null

  try {
    return await retrieveAiWorkspaceContext(db, {
      spaceId: body.spaceId,
      userId,
      query: buildRetrievalQuery([
        body.prompt,
        body.taskTitle,
        body.taskContext.slice(0, 4000),
      ]),
      excludeTaskId: body.taskId,
      linkedPageId: body.linkedPageId,
      authSecret: env.BETTER_AUTH_SECRET,
      noteLimit: 4,
      taskLimit: 3,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      throw error
    }
    return null
  }
}

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

    let workspaceContext = null
    try {
      workspaceContext = await loadWorkspaceContextForCompletion(db, env, user.id, body)
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }

    if (body.contextRefs?.length && body.spaceId) {
      const explicit = await loadExplicitAiContextRefs(db, body.spaceId, user.id, body.contextRefs)
      workspaceContext = mergeExplicitContextIntoWorkspace(workspaceContext, explicit)
    }

    const messages = buildCompletionMessages({ ...body, workspaceContext })

    try {
      const upstream = await streamChatCompletion(
        apiKey,
        model,
        messages,
        c.req.raw.signal,
        body.maxTokens,
      )

      const stream =
        workspaceContext?.citations.length
          ? prependWorkspaceMetaToStream(upstream, workspaceContext.citations)
          : upstream

      const headers: Record<string, string> = {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      }

      if (workspaceContext?.citations.length) {
        headers['X-Workspace-Citations'] = encodeURIComponent(
          JSON.stringify(workspaceContext.citations),
        )
      }

      return new Response(stream, { headers })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Completion failed'
      return c.json({ error: message }, 400)
    }
  })

  app.post('/teamspace-chat', zValidator('json', teamspaceChatRequestSchema), async (c) => {
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
    if (!settings.featureFlags.teamspaceAsk) {
      return c.json({ error: 'Enable “Ask teamspace” in Settings → AI' }, 403)
    }

    const model = body.model ?? settings.defaultModel

    let workspaceContext = null
    try {
      const retrievalQuery = buildRetrievalQuery([
        body.prompt,
        ...(body.messages ?? []).slice(-4).map((message) => message.content),
      ])

      workspaceContext = await retrieveAiWorkspaceContext(db, {
        spaceId: body.spaceId,
        userId: user.id,
        query: retrievalQuery,
        authSecret: env.BETTER_AUTH_SECRET,
        noteLimit: isLaunchBlockerQuery(retrievalQuery) ? 8 : 5,
        taskLimit: isLaunchBlockerQuery(retrievalQuery) ? 8 : 4,
        enrichNotes: true,
      })

      if (body.contextRefs?.length) {
        const explicit = await loadExplicitAiContextRefs(db, body.spaceId, user.id, body.contextRefs)
        workspaceContext = mergeExplicitContextIntoWorkspace(workspaceContext, explicit)
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }

    if (!workspaceContext) {
      return c.json({ error: 'Could not load teamspace context' }, 400)
    }

    const messages = buildTeamspaceChatMessages(body, workspaceContext)

    try {
      const stream = await streamChatCompletion(apiKey, model, messages, c.req.raw.signal)

      return new Response(prependWorkspaceMetaToStream(stream, workspaceContext.citations), {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Workspace-Citations': encodeURIComponent(JSON.stringify(workspaceContext.citations)),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Teamspace chat failed'
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

    let hydratedBody = body
    try {
      hydratedBody = await hydrateTaskAgentRequest(db, user.id, body)
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }

    let workspaceContext = null
    try {
      workspaceContext = await loadWorkspaceContextForTaskAgent(db, env, user.id, hydratedBody)
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }

    try {
      const result = await runTaskAgent(apiKey, model, hydratedBody, workspaceContext)
      return c.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task assistant failed'
      return c.json({ error: message }, 400)
    }
  })

  app.post('/parse-board-filter', zValidator('json', parseBoardFilterSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = c.req.valid('json')

    try {
      await requireSpaceMembership(db, body.spaceId, user.id)
    } catch {
      return c.json({ error: 'Forbidden' }, 403)
    }

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
      const filters = await parseBoardFilterFromPrompt(
        apiKey,
        model,
        body.prompt,
        body.properties,
      )
      return c.json({ filters })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not parse filters'
      return c.json({ error: message }, 400)
    }
  })

  app.get('/space-digest/:spaceId', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const spaceId = c.req.param('spaceId')

    try {
      const digest = await getSpaceAiDigest(db, spaceId, user.id)
      return c.json(digest)
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }
  })

  app.get('/threads', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const spaceId = c.req.query('spaceId')
    const scopeType = c.req.query('scopeType')
    const scopeId = c.req.query('scopeId')

    if (!spaceId || !scopeType || !scopeId) {
      return c.json({ error: 'Missing query parameters' }, 400)
    }

    if (scopeType !== 'page' && scopeType !== 'task' && scopeType !== 'teamspace') {
      return c.json({ error: 'Invalid scopeType' }, 400)
    }

    try {
      const threads = await aiThreadsService.listAiThreads(
        db,
        spaceId,
        user.id,
        scopeType,
        scopeId,
      )
      return c.json({
        threads: threads.map((thread) => ({
          ...thread,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
        })),
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }
  })

  app.put('/threads/sync', zValidator('json', syncAiThreadsSchema), async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = c.req.valid('json')

    try {
      const result = await aiThreadsService.syncAiThreadStore(db, {
        spaceId: body.spaceId,
        userId: user.id,
        scopeType: body.scopeType,
        scopeId: body.scopeId,
        activeThreadId: body.activeThreadId,
        threads: body.threads,
      })
      return c.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }
  })

  app.delete('/threads/:threadId', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const spaceId = c.req.query('spaceId')
    const threadId = c.req.param('threadId')

    if (!spaceId) {
      return c.json({ error: 'Missing spaceId' }, 400)
    }

    try {
      const result = await aiThreadsService.deleteAiThread(db, spaceId, user.id, threadId)
      return c.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Not found') {
        return c.json({ error: 'Not found' }, 404)
      }
      if (error instanceof Error && error.message === 'Forbidden') {
        return c.json({ error: 'Forbidden' }, 403)
      }
      throw error
    }
  })

  app.post('/spec-to-tasks', zValidator('json', specToTasksSchema), async (c) => {
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

    try {
      await requireSpaceMembership(db, body.spaceId, user.id)
    } catch {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const [page] = await db
      .select({ title: pages.title, plaintext: pages.plaintext })
      .from(pages)
      .where(eq(pages.id, body.pageId))
      .limit(1)

    if (!page) {
      return c.json({ error: 'Page not found' }, 404)
    }

    const database = await databasesService.getDatabase(db, body.spaceId, body.boardId, user.id)
    const settings = await settingsService.getAiSettings(db, user.id, env.BETTER_AUTH_SECRET)
    const model = body.model ?? settings.defaultModel

    const properties = database.schema.properties.map((property) => ({
      id: property.id,
      name: property.name,
      type: property.type as 'text' | 'number' | 'select' | 'multi_select',
      options: property.config?.options?.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    }))

    const parsed = await breakSpecIntoTasks(apiKey, model, {
      pageTitle: page.title,
      pageContent: page.plaintext,
      boardTitle: database.title,
      properties,
    })

    if (!body.create) {
      return c.json(parsed)
    }

    const created = []

    for (const task of parsed.tasks) {
      const propertiesInput: Record<string, unknown> = {
        title: task.title,
      }

      if (task.description) {
        propertiesInput.description = task.description
      }
      if (task.status) {
        propertiesInput.status = task.status
      }
      if (task.assigneeId !== undefined) {
        propertiesInput.assignee = task.assigneeId
      }
      if (task.labelIds?.length) {
        propertiesInput.labels = task.labelIds
      }

      const row = await databasesService.createRow(
        db,
        body.spaceId,
        body.boardId,
        user.id,
        { properties: propertiesInput },
        env.BETTER_AUTH_SECRET,
      )

      created.push({
        id: row.id,
        title: task.title,
      })
    }

    return c.json({ ...parsed, created })
  })

  return app
}
