import { useEffect, useMemo, useRef, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { PageTitleInput } from '@/features/editor/components/page-title-input'
import { useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { ProjectTaskDescriptionEditor } from './project-task-description-editor'
import { ProjectTaskDetailsSidebar } from './project-task-details-sidebar'

type ProjectTaskDetailsTabProps = {
  spaceId: string
  boardId: string
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
  taskTitle: string
  taskContext: string
  readOnly?: boolean
  onClose: () => void
}

function formatTaskUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ProjectTaskDetailsTab({
  spaceId,
  boardId,
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
  taskTitle,
  taskContext,
  readOnly = false,
  onClose,
}: ProjectTaskDetailsTabProps) {
  const updateCell = useUpdateCell(spaceId, boardId)
  const descriptionFocusRef = useRef<(() => void) | null>(null)
  const updatedLabel = formatTaskUpdatedAt(row.updatedAt)

  const schemaProperties = useMemo(() => {
    const properties: PropertyDefinition[] = [titleProperty]
    properties.push({ id: 'description', name: 'Description', type: 'text' })
    properties.push(groupProperty)
    if (labelProperty) properties.push(labelProperty)
    if (milestoneProperty) properties.push(milestoneProperty)
    if (priorityProperty) properties.push(priorityProperty)
    if (estimateProperty) properties.push(estimateProperty)
    properties.push({ id: 'due_date', name: 'Due date', type: 'text' })
    properties.push({ id: 'assignee', name: 'Assignee', type: 'text' })
    return properties
  }, [
    titleProperty,
    groupProperty,
    labelProperty,
    milestoneProperty,
    priorityProperty,
    estimateProperty,
  ])

  const rawTitle = row.properties[titleProperty.id]
  const savedTitle = typeof rawTitle === 'string' ? rawTitle : ''
  const [draftTitle, setDraftTitle] = useState(savedTitle)

  useEffect(() => {
    setDraftTitle(savedTitle)
  }, [savedTitle, row.id])

  function commitTitle() {
    const next = draftTitle.trim()
    if (next === savedTitle.trim()) return
    void updateCell.mutateAsync({ rowId: row.id, propertyId: titleProperty.id, value: next })
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface/40">
        <div className="shrink-0 border-b border-border/60 px-5 pb-3 pt-4">
          <PageTitleInput
            title={draftTitle}
            onChange={setDraftTitle}
            onBlur={commitTitle}
            onEnter={() => descriptionFocusRef.current?.()}
            readOnly={readOnly}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2">
          <ProjectTaskDescriptionEditor
            spaceId={spaceId}
            rowId={row.id}
            value={row.properties.description}
            pages={pages}
            readOnly={readOnly}
            onFocusReady={(focus) => {
              descriptionFocusRef.current = focus
            }}
            onCommit={(value) =>
              void updateCell.mutateAsync({
                rowId: row.id,
                propertyId: 'description',
                value,
              })
            }
          />
        </div>
      </section>

      <ProjectTaskDetailsSidebar
        spaceId={spaceId}
        boardId={boardId}
        row={row}
        groupProperty={groupProperty}
        labelProperty={labelProperty}
        milestoneProperty={milestoneProperty}
        priorityProperty={priorityProperty}
        estimateProperty={estimateProperty}
        linkedNoteProperty={linkedNoteProperty}
        pages={pages}
        members={members}
        taskTitle={taskTitle}
        taskContext={taskContext}
        schemaProperties={schemaProperties}
        updatedLabel={updatedLabel}
        readOnly={readOnly}
        onClose={onClose}
      />
    </div>
  )
}
