import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { aiThreads } from '../../db/schema/ai-threads'
import { requireSpaceMembership } from '../spaces/permissions'

export type AiThreadScopeType = 'page' | 'task' | 'teamspace'

export type AiThreadMessage = {
  role: 'user' | 'assistant'
  content: string
  citations?: unknown[]
}

export type AiThreadRecord = {
  id: string
  spaceId: string
  userId: string
  scopeType: AiThreadScopeType
  scopeId: string
  title: string
  messages: AiThreadMessage[]
  createdAt: Date
  updatedAt: Date
}

function normalizeMessages(raw: unknown): AiThreadMessage[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const record = item as Partial<AiThreadMessage>
    if (record.role !== 'user' && record.role !== 'assistant') return []
    if (typeof record.content !== 'string') return []
    return [{ role: record.role, content: record.content, citations: record.citations }]
  })
}

export async function listAiThreads(
  db: Db,
  spaceId: string,
  userId: string,
  scopeType: AiThreadScopeType,
  scopeId: string,
): Promise<AiThreadRecord[]> {
  await requireSpaceMembership(db, spaceId, userId)

  const rows = await db
    .select()
    .from(aiThreads)
    .where(
      and(
        eq(aiThreads.spaceId, spaceId),
        eq(aiThreads.userId, userId),
        eq(aiThreads.scopeType, scopeType),
        eq(aiThreads.scopeId, scopeId),
      ),
    )
    .orderBy(desc(aiThreads.updatedAt))
    .limit(40)

  return rows.map((row) => ({
    id: row.id,
    spaceId: row.spaceId,
    userId: row.userId,
    scopeType: row.scopeType as AiThreadScopeType,
    scopeId: row.scopeId,
    title: row.title,
    messages: normalizeMessages(row.messages),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

export async function upsertAiThread(
  db: Db,
  input: {
    spaceId: string
    userId: string
    scopeType: AiThreadScopeType
    scopeId: string
    threadId?: string
    title: string
    messages: AiThreadMessage[]
  },
) {
  await requireSpaceMembership(db, input.spaceId, input.userId)

  const now = new Date()
  const id = input.threadId ?? randomUUID()
  const messages = input.messages.filter((message) => message.content.trim())

  const [existing] = await db
    .select({ id: aiThreads.id })
    .from(aiThreads)
    .where(
      and(
        eq(aiThreads.id, id),
        eq(aiThreads.userId, input.userId),
        eq(aiThreads.spaceId, input.spaceId),
      ),
    )
    .limit(1)

  if (existing) {
    await db
      .update(aiThreads)
      .set({
        title: input.title.trim() || 'New conversation',
        messages,
        updatedAt: now,
      })
      .where(eq(aiThreads.id, id))

    return { id, created: false }
  }

  await db.insert(aiThreads).values({
    id,
    spaceId: input.spaceId,
    userId: input.userId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    title: input.title.trim() || 'New conversation',
    messages,
    createdAt: now,
    updatedAt: now,
  })

  return { id, created: true }
}

export async function deleteAiThread(
  db: Db,
  spaceId: string,
  userId: string,
  threadId: string,
) {
  await requireSpaceMembership(db, spaceId, userId)

  const [deleted] = await db
    .delete(aiThreads)
    .where(
      and(
        eq(aiThreads.id, threadId),
        eq(aiThreads.userId, userId),
        eq(aiThreads.spaceId, spaceId),
      ),
    )
    .returning({ id: aiThreads.id })

  if (!deleted) {
    throw new Error('Not found')
  }

  return deleted
}

export async function syncAiThreadStore(
  db: Db,
  input: {
    spaceId: string
    userId: string
    scopeType: AiThreadScopeType
    scopeId: string
    activeThreadId: string
    threads: Array<{
      id: string
      title: string
      messages: AiThreadMessage[]
      createdAt?: number
      updatedAt?: number
    }>
  },
) {
  await requireSpaceMembership(db, input.spaceId, input.userId)

  const results = []

  for (const thread of input.threads.slice(0, 40)) {
    const result = await upsertAiThread(db, {
      spaceId: input.spaceId,
      userId: input.userId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      threadId: thread.id,
      title: thread.title,
      messages: thread.messages,
    })
    results.push(result)
  }

  return { synced: results.length, activeThreadId: input.activeThreadId }
}
