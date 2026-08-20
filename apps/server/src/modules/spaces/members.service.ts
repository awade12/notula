import { randomBytes, randomUUID } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { user } from '../../db/schema/auth'
import { spaceInvites } from '../../db/schema/invites'
import { spaceMembers, spaces } from '../../db/schema/spaces'
import {
  canManageMembers,
  normalizeSpaceRole,
  type SpaceRole,
} from './roles'
import { getSpaceMembership, requireSpaceMembership } from './permissions'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function createInviteToken() {
  return randomBytes(24).toString('base64url')
}

export async function listSpaceMembers(db: Db, spaceId: string, userId: string) {
  await requireSpaceMembership(db, spaceId, userId)

  return db
    .select({
      id: spaceMembers.id,
      userId: spaceMembers.userId,
      role: spaceMembers.role,
      createdAt: spaceMembers.createdAt,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(spaceMembers)
    .innerJoin(user, eq(spaceMembers.userId, user.id))
    .where(eq(spaceMembers.spaceId, spaceId))
}

export async function updateMemberRole(
  db: Db,
  spaceId: string,
  actorId: string,
  memberId: string,
  role: SpaceRole,
) {
  const actor = await requireSpaceMembership(db, spaceId, actorId)
  if (!canManageMembers(normalizeSpaceRole(actor.role))) {
    throw new Error('Forbidden')
  }

  const [target] = await db
    .select()
    .from(spaceMembers)
    .where(and(eq(spaceMembers.id, memberId), eq(spaceMembers.spaceId, spaceId)))
    .limit(1)

  if (!target) {
    throw new Error('Not found')
  }

  if (target.role === 'owner' && role !== 'owner') {
    const owners = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.role, 'owner')))

    if (owners.length <= 1) {
      throw new Error('Cannot demote the last owner')
    }
  }

  await db
    .update(spaceMembers)
    .set({ role })
    .where(eq(spaceMembers.id, memberId))

  return { id: memberId, role }
}

export async function removeMember(
  db: Db,
  spaceId: string,
  actorId: string,
  memberId: string,
) {
  const actor = await requireSpaceMembership(db, spaceId, actorId)
  if (!canManageMembers(normalizeSpaceRole(actor.role))) {
    throw new Error('Forbidden')
  }

  const [target] = await db
    .select()
    .from(spaceMembers)
    .where(and(eq(spaceMembers.id, memberId), eq(spaceMembers.spaceId, spaceId)))
    .limit(1)

  if (!target) {
    throw new Error('Not found')
  }

  if (target.role === 'owner') {
    const owners = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.role, 'owner')))

    if (owners.length <= 1) {
      throw new Error('Cannot remove the last owner')
    }
  }

  await db.delete(spaceMembers).where(eq(spaceMembers.id, memberId))
  return { removedId: memberId }
}

export async function listSpaceInvites(db: Db, spaceId: string, userId: string) {
  const actor = await requireSpaceMembership(db, spaceId, userId)
  if (!canManageMembers(normalizeSpaceRole(actor.role))) {
    throw new Error('Forbidden')
  }

  const now = new Date()

  return db
    .select({
      id: spaceInvites.id,
      token: spaceInvites.token,
      role: spaceInvites.role,
      email: spaceInvites.email,
      expiresAt: spaceInvites.expiresAt,
      createdAt: spaceInvites.createdAt,
    })
    .from(spaceInvites)
    .where(and(eq(spaceInvites.spaceId, spaceId), gt(spaceInvites.expiresAt, now)))
}

export async function createSpaceInvite(
  db: Db,
  spaceId: string,
  userId: string,
  input: { role: SpaceRole; email?: string | null },
) {
  const actor = await requireSpaceMembership(db, spaceId, userId)
  if (!canManageMembers(normalizeSpaceRole(actor.role))) {
    throw new Error('Forbidden')
  }

  if (input.role === 'owner') {
    throw new Error('Cannot invite as owner')
  }

  const id = randomUUID()
  const token = createInviteToken()
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

  await db.insert(spaceInvites).values({
    id,
    spaceId,
    token,
    role: input.role,
    invitedBy: userId,
    email: input.email?.trim() || null,
    expiresAt,
  })

  return { id, token, role: input.role, expiresAt }
}

export async function revokeSpaceInvite(
  db: Db,
  spaceId: string,
  userId: string,
  inviteId: string,
) {
  const actor = await requireSpaceMembership(db, spaceId, userId)
  if (!canManageMembers(normalizeSpaceRole(actor.role))) {
    throw new Error('Forbidden')
  }

  const result = await db
    .delete(spaceInvites)
    .where(and(eq(spaceInvites.id, inviteId), eq(spaceInvites.spaceId, spaceId)))
    .returning({ id: spaceInvites.id })

  if (!result[0]) {
    throw new Error('Not found')
  }

  return { revokedId: inviteId }
}

export async function getInvitePreview(db: Db, token: string) {
  const now = new Date()

  const [invite] = await db
    .select({
      id: spaceInvites.id,
      role: spaceInvites.role,
      expiresAt: spaceInvites.expiresAt,
      spaceId: spaceInvites.spaceId,
      spaceName: spaces.name,
    })
    .from(spaceInvites)
    .innerJoin(spaces, eq(spaceInvites.spaceId, spaces.id))
    .where(and(eq(spaceInvites.token, token), gt(spaceInvites.expiresAt, now)))
    .limit(1)

  if (!invite) {
    throw new Error('Not found')
  }

  return invite
}

export async function acceptSpaceInvite(db: Db, token: string, userId: string) {
  const now = new Date()

  const [invite] = await db
    .select()
    .from(spaceInvites)
    .where(and(eq(spaceInvites.token, token), gt(spaceInvites.expiresAt, now)))
    .limit(1)

  if (!invite) {
    throw new Error('Not found')
  }

  const existing = await getSpaceMembership(db, invite.spaceId, userId)
  if (existing) {
    await db.delete(spaceInvites).where(eq(spaceInvites.id, invite.id))
    return { spaceId: invite.spaceId, alreadyMember: true }
  }

  await db.insert(spaceMembers).values({
    id: randomUUID(),
    spaceId: invite.spaceId,
    userId,
    role: invite.role,
  })

  await db.delete(spaceInvites).where(eq(spaceInvites.id, invite.id))

  return { spaceId: invite.spaceId, alreadyMember: false }
}
