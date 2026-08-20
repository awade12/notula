import { randomUUID } from 'node:crypto'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { notifications } from '../../db/schema/notifications'

export async function listNotifications(db: Db, userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

export async function getUnreadNotificationCount(db: Db, userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))

  return row?.count ?? 0
}

export async function markNotificationRead(db: Db, userId: string, notificationId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })

  if (!updated) {
    throw new Error('Not found')
  }

  return updated
}

export async function markAllNotificationsRead(db: Db, userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))

  return { ok: true }
}

export async function createCommentNotifications(
  db: Db,
  input: {
    actorId: string
    spaceId: string
    pageId: string
    pageTitle: string
    recipientUserIds: string[]
  },
) {
  const uniqueRecipients = [...new Set(input.recipientUserIds)].filter(
    (id) => id !== input.actorId,
  )

  if (uniqueRecipients.length === 0) return { created: 0 }

  const now = new Date()

  await db.insert(notifications).values(
    uniqueRecipients.map((userId) => ({
      id: randomUUID(),
      userId,
      spaceId: input.spaceId,
      pageId: input.pageId,
      type: 'comment',
      title: `New comment on ${input.pageTitle}`,
      body: 'Someone replied in a thread you follow',
      createdAt: now,
    })),
  )

  return { created: uniqueRecipients.length }
}
