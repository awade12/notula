import { and, eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { spaceMembers } from '../../db/schema/spaces'

export async function getSpaceMembership(db: Db, spaceId: string, userId: string) {
  const [membership] = await db
    .select({
      id: spaceMembers.id,
      role: spaceMembers.role,
    })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
    .limit(1)

  return membership ?? null
}

export async function requireSpaceMembership(db: Db, spaceId: string, userId: string) {
  const membership = await getSpaceMembership(db, spaceId, userId)
  if (!membership) {
    throw new Error('Forbidden')
  }
  return membership
}
