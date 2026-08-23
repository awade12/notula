import { useEffect, useMemo } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import type { ConnectionStatus } from '@/features/editor/types'
import { useLiveDatabaseRow } from '@/features/database/hooks/use-live-database-row'
import { buildProjectTaskContext } from '../lib/build-task-context'
import { resolveLinkedPageId } from '../lib/resolve-linked-page-id'
import { ProjectTaskDetailsTab } from './project-task-details-tab'
import { ProjectTaskPanelFrame } from './project-task-panel-frame'

type ProjectTaskPanelProps = {
  spaceId: string
  boardId: string
  boardTitle: string
  row: DatabaseRow
  groupProperty: PropertyDefinition
  titleProperty: PropertyDefinition
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  estimateProperty?: PropertyDefinition
  linkedNoteProperty?: PropertyDefinition
  pages: FlatPage[]
  members: SpaceMember[]
  readOnly?: boolean
  connectionStatus?: ConnectionStatus
  taskUrl?: string
  onClose: () => void
}

export function ProjectTaskPanel({
  spaceId,
  boardId,
  boardTitle,
  row,
  groupProperty,
  titleProperty,
  labelProperty,
  milestoneProperty,
  priorityProperty,
  estimateProperty,
  linkedNoteProperty,
  pages,
  members,
  readOnly = false,
  connectionStatus = 'synced',
  taskUrl,
  onClose,
}: ProjectTaskPanelProps) {
  const liveRow = useLiveDatabaseRow(spaceId, boardId, row.id, row)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const rawTitle = liveRow.properties[titleProperty.id]
  const taskTitle = typeof rawTitle === 'string' ? rawTitle : ''

  const taskContext = useMemo(
    () =>
      buildProjectTaskContext({
        row: liveRow,
        boardTitle,
        titlePropertyId: titleProperty.id,
        statusProperty: groupProperty,
        labelProperty,
        milestoneProperty,
        priorityProperty,
        members,
      }),
    [
      boardTitle,
      groupProperty,
      labelProperty,
      liveRow,
      milestoneProperty,
      members,
      priorityProperty,
      titleProperty.id,
    ],
  )

  const linkedPageId = useMemo(() => {
    if (!linkedNoteProperty) return undefined
    const resolved = resolveLinkedPageId(liveRow.properties[linkedNoteProperty.id])
    return resolved ?? undefined
  }, [linkedNoteProperty, liveRow.properties])

  const linkedPageTitle = useMemo(() => {
    if (!linkedPageId) return undefined
    return pages.find((page) => page.id === linkedPageId)?.title
  }, [linkedPageId, pages])

  return (
    <ProjectTaskPanelFrame boardTitle={boardTitle} taskUrl={taskUrl} onClose={onClose}>
      <ProjectTaskDetailsTab
        spaceId={spaceId}
        boardId={boardId}
        row={liveRow}
        groupProperty={groupProperty}
        titleProperty={titleProperty}
        labelProperty={labelProperty}
        milestoneProperty={milestoneProperty}
        priorityProperty={priorityProperty}
        estimateProperty={estimateProperty}
        linkedNoteProperty={linkedNoteProperty}
        pages={pages}
        members={members}
        taskTitle={taskTitle}
        taskContext={taskContext}
        linkedPageId={linkedPageId}
        linkedPageTitle={linkedPageTitle}
        connectionStatus={connectionStatus}
        readOnly={readOnly}
        onClose={onClose}
      />
    </ProjectTaskPanelFrame>
  )
}
