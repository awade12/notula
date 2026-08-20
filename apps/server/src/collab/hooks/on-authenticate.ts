import { eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { databases } from '../../db/schema/databases'
import { findSessionByToken } from '../../modules/auth/session'
import { getPageForCollab } from '../../modules/pages/service'
import { requireSpaceMembership } from '../../modules/spaces/permissions'
import { canEditSpace, normalizeSpaceRole } from '../../modules/spaces/roles'

const PAGE_PREFIX = 'page:'
const DATABASE_PREFIX = 'database:'

export function parsePageDocumentName(documentName: string) {
  if (!documentName.startsWith(PAGE_PREFIX)) {
    return null
  }
  return documentName.slice(PAGE_PREFIX.length)
}

export function parseDatabaseDocumentName(documentName: string) {
  if (!documentName.startsWith(DATABASE_PREFIX)) {
    return null
  }
  return documentName.slice(DATABASE_PREFIX.length)
}

type AuthenticateInput = {
  token: string
  documentName: string
  connection: { readOnly: boolean }
}

export function createOnAuthenticate(deps: { db: Db }) {
  return async ({ token, documentName, connection }: AuthenticateInput) => {
    const session = await findSessionByToken(deps.db, token)
    if (!session) {
      throw new Error('Unauthorized')
    }

    const databaseId = parseDatabaseDocumentName(documentName)
    if (databaseId) {
      const [database] = await deps.db
        .select({ id: databases.id, spaceId: databases.spaceId })
        .from(databases)
        .where(eq(databases.id, databaseId))
        .limit(1)

      if (!database) {
        throw new Error('Not found')
      }

      const membership = await requireSpaceMembership(deps.db, database.spaceId, session.user.id)
      connection.readOnly = !canEditSpace(normalizeSpaceRole(membership.role))

      return {
        user: session.user,
        databaseId: database.id,
        spaceId: database.spaceId,
        role: membership.role,
      }
    }

    const pageId = parsePageDocumentName(documentName)
    if (!pageId) {
      throw new Error('Invalid document')
    }

    const page = await getPageForCollab(deps.db, pageId)
    if (!page) {
      throw new Error('Not found')
    }

    const membership = await requireSpaceMembership(deps.db, page.spaceId, session.user.id)
    connection.readOnly = !canEditSpace(normalizeSpaceRole(membership.role))

    return {
      user: session.user,
      pageId: page.id,
      spaceId: page.spaceId,
      role: membership.role,
    }
  }
}
