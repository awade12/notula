import type { Hocuspocus } from '@hocuspocus/server'
import { databaseDocumentName, pageDocumentName } from './server'

export type InsightsChangedPayload = {
  type: 'insights-changed'
  spaceId: string
  pageId: string
}

export type InsightUpdatePayload = {
  type: 'insight-update'
  insightId: string
  changes: { status?: string; dueDate?: string }
}

export type DatabaseRowUpdatePayload = {
  type: 'database-row-update'
  databaseId: string
  rowId: string
  propertyId?: string
  value?: unknown
  properties?: Record<string, unknown>
  action?: 'create' | 'delete'
  row?: {
    id: string
    databaseId: string
    properties: Record<string, unknown>
    position: string
    updatedAt: string
  }
}

export type DatabaseChangedPayload = {
  type: 'database-changed'
  databaseId: string
  change: 'schema' | 'view' | 'rows'
}

export function broadcastInsightsChanged(
  collab: Hocuspocus,
  spaceId: string,
  pageId: string,
) {
  const document = collab.documents.get(pageDocumentName(pageId))
  if (!document) return

  const payload: InsightsChangedPayload = {
    type: 'insights-changed',
    spaceId,
    pageId,
  }
  document.broadcastStateless(JSON.stringify(payload))
}

export function broadcastInsightUpdate(
  collab: Hocuspocus,
  pageId: string,
  insightId: string,
  changes: { status?: string; dueDate?: string },
) {
  const document = collab.documents.get(pageDocumentName(pageId))
  if (!document) return

  const payload: InsightUpdatePayload = {
    type: 'insight-update',
    insightId,
    changes,
  }
  document.broadcastStateless(JSON.stringify(payload))
}

export function broadcastDatabaseRowUpdate(
  collab: Hocuspocus,
  databaseId: string,
  payload: Omit<DatabaseRowUpdatePayload, 'type' | 'databaseId'>,
) {
  const document = collab.documents.get(databaseDocumentName(databaseId))
  if (!document) return

  const message: DatabaseRowUpdatePayload = {
    type: 'database-row-update',
    databaseId,
    ...payload,
  }
  document.broadcastStateless(JSON.stringify(message))
}

export function broadcastDatabaseChanged(
  collab: Hocuspocus,
  databaseId: string,
  change: DatabaseChangedPayload['change'],
) {
  const document = collab.documents.get(databaseDocumentName(databaseId))
  if (!document) return

  const payload: DatabaseChangedPayload = {
    type: 'database-changed',
    databaseId,
    change,
  }
  document.broadcastStateless(JSON.stringify(payload))
}

export function isPageDocumentLive(collab: Hocuspocus, pageId: string) {
  const document = collab.documents.get(pageDocumentName(pageId))
  return Boolean(document && document.getConnectionsCount() > 0)
}

export function isDatabaseDocumentLive(collab: Hocuspocus, databaseId: string) {
  const document = collab.documents.get(databaseDocumentName(databaseId))
  return Boolean(document && document.getConnectionsCount() > 0)
}
