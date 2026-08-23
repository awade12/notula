import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { useDeleteRow, useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { taskDeleteIcon } from '../lib/project-icon-pack'
import { ProjectTaskAssigneeField } from './project-task-assignee-field'
import { ProjectTaskDocumentationField } from './project-task-documentation-field'
import { ProjectTaskDueDateField } from './project-task-due-date-field'
import { ProjectTaskMultiSelectField } from './project-task-multi-select-field'
import { ProjectTaskNumberField } from './project-task-number-field'
import {
  ProjectTaskPropertyRow,
  ProjectTaskPropertySection,
} from './project-task-property-row'
import { ProjectTaskSelectField } from './project-task-select-field'
import { ProjectTaskSubtasksSection } from './project-task-subtasks-section'

type ProjectTaskPropertiesPanelProps = {
  spaceId: string
  boardId: string
  row: DatabaseRow
  rows?: DatabaseRow[]
  groupProperty: PropertyDefinition
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  estimateProperty?: PropertyDefinition
  linkedNoteProperty?: PropertyDefinition
  pages: FlatPage[]
  members: SpaceMember[]
  updatedLabel?: string | null
  readOnly?: boolean
  onOpenTask?: (taskId: string) => void
  onClose: () => void
}

const FIELD_VARIANT = 'inline' as const

export function ProjectTaskPropertiesPanel({
  spaceId,
  boardId,
  row,
  rows = [],
  groupProperty,
  labelProperty,
  milestoneProperty,
  priorityProperty,
  estimateProperty,
  linkedNoteProperty,
  pages,
  members,
  updatedLabel,
  readOnly = false,
  onOpenTask,
  onClose,
}: ProjectTaskPropertiesPanelProps) {
  const updateCell = useUpdateCell(spaceId, boardId)
  const deleteRow = useDeleteRow(spaceId, boardId)

  async function handleDelete() {
    if (readOnly) return
    const confirmed = window.confirm('Delete this task?')
    if (!confirmed) return
    await deleteRow.mutateAsync(row.id)
    onClose()
  }

  const hasWorkflowExtras = Boolean(labelProperty || priorityProperty || milestoneProperty)
  const hasPlanningExtras = Boolean(estimateProperty)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-none flex-1 space-y-4 px-3 py-3">
        <ProjectTaskPropertySection title={hasWorkflowExtras ? 'Workflow' : undefined}>
          <ProjectTaskPropertyRow label="Status">
            <ProjectTaskSelectField
              property={groupProperty}
              value={row.properties[groupProperty.id]}
              readOnly={readOnly}
              emptyLabel="No status"
              variant={FIELD_VARIANT}
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: groupProperty.id,
                  value,
                })
              }
            />
          </ProjectTaskPropertyRow>

          {labelProperty ? (
            <ProjectTaskPropertyRow label="Labels" align="start" valueAlign="start">
              {labelProperty.type === 'multi_select' ? (
                <ProjectTaskMultiSelectField
                  property={labelProperty}
                  value={row.properties[labelProperty.id]}
                  readOnly={readOnly}
                  emptyLabel="Add labels"
                  variant={FIELD_VARIANT}
                  onCommit={(value) =>
                    void updateCell.mutateAsync({
                      rowId: row.id,
                      propertyId: labelProperty.id,
                      value,
                    })
                  }
                />
              ) : (
                <ProjectTaskSelectField
                  property={labelProperty}
                  value={row.properties[labelProperty.id]}
                  readOnly={readOnly}
                  emptyLabel="No label"
                  variant={FIELD_VARIANT}
                  onCommit={(value) =>
                    void updateCell.mutateAsync({
                      rowId: row.id,
                      propertyId: labelProperty.id,
                      value,
                    })
                  }
                />
              )}
            </ProjectTaskPropertyRow>
          ) : null}

          {priorityProperty ? (
            <ProjectTaskPropertyRow label="Priority">
              <ProjectTaskSelectField
                property={priorityProperty}
                value={row.properties[priorityProperty.id]}
                readOnly={readOnly}
                emptyLabel="No priority"
                variant={FIELD_VARIANT}
                onCommit={(value) =>
                  void updateCell.mutateAsync({
                    rowId: row.id,
                    propertyId: priorityProperty.id,
                    value,
                  })
                }
              />
            </ProjectTaskPropertyRow>
          ) : null}

          {milestoneProperty ? (
            <ProjectTaskPropertyRow label="Milestone">
              <ProjectTaskSelectField
                property={milestoneProperty}
                value={row.properties[milestoneProperty.id]}
                readOnly={readOnly}
                emptyLabel="No milestone"
                variant={FIELD_VARIANT}
                onCommit={(value) =>
                  void updateCell.mutateAsync({
                    rowId: row.id,
                    propertyId: milestoneProperty.id,
                    value,
                  })
                }
              />
            </ProjectTaskPropertyRow>
          ) : null}
        </ProjectTaskPropertySection>

        <ProjectTaskPropertySection title={hasPlanningExtras ? 'Planning' : undefined}>
          <ProjectTaskPropertyRow label="Assignees">
            <ProjectTaskAssigneeField
              value={row.properties.assignee}
              members={members}
              readOnly={readOnly}
              variant={FIELD_VARIANT}
              onCommit={(userIds) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: 'assignee',
                  value: userIds,
                })
              }
            />
          </ProjectTaskPropertyRow>

          <ProjectTaskPropertyRow label="Due date">
            <ProjectTaskDueDateField
              value={row.properties.due_date}
              readOnly={readOnly}
              variant={FIELD_VARIANT}
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: 'due_date',
                  value,
                })
              }
            />
          </ProjectTaskPropertyRow>

          {estimateProperty ? (
            <ProjectTaskPropertyRow label="Estimate">
              <ProjectTaskNumberField
                value={row.properties[estimateProperty.id]}
                readOnly={readOnly}
                placeholder="—"
                suffix="pts"
                variant={FIELD_VARIANT}
                onCommit={(value) =>
                  void updateCell.mutateAsync({
                    rowId: row.id,
                    propertyId: estimateProperty.id,
                    value,
                  })
                }
              />
            </ProjectTaskPropertyRow>
          ) : null}
        </ProjectTaskPropertySection>

        {linkedNoteProperty ? (
          <ProjectTaskPropertySection title="Links">
            <ProjectTaskPropertyRow label="Documentation" align="start">
              <ProjectTaskDocumentationField
                spaceId={spaceId}
                value={row.properties[linkedNoteProperty.id]}
                pages={pages}
                readOnly={readOnly}
                variant={FIELD_VARIANT}
                onCommit={(value) =>
                  void updateCell.mutateAsync({
                    rowId: row.id,
                    propertyId: linkedNoteProperty.id,
                    value,
                  })
                }
              />
            </ProjectTaskPropertyRow>
          </ProjectTaskPropertySection>
        ) : null}
      </div>

      {onOpenTask ? (
        <ProjectTaskSubtasksSection
          spaceId={spaceId}
          boardId={boardId}
          parentRow={row}
          rows={rows}
          groupProperty={groupProperty}
          readOnly={readOnly}
          onOpenTask={onOpenTask}
        />
      ) : null}

      {!readOnly ? (
        <div className="shrink-0 border-t border-border/60 px-3 py-3">
          {updatedLabel ? (
            <p className="mb-2 text-[10px] tracking-wide text-text-primary/30">
              Updated {updatedLabel}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleteRow.isPending}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
          >
            <WorkspaceIcon icon={taskDeleteIcon} size={iconSize.section} />
            {deleteRow.isPending ? 'Deleting…' : 'Delete task'}
          </button>
        </div>
      ) : updatedLabel ? (
        <div className="shrink-0 border-t border-border/60 px-3 py-3">
          <p className="text-[10px] tracking-wide text-text-primary/30">Updated {updatedLabel}</p>
        </div>
      ) : null}
    </div>
  )
}
