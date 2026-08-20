import type { ReactNode } from 'react'
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
import { ProjectTaskSelectField } from './project-task-select-field'

type ProjectTaskPropertiesPanelProps = {
  spaceId: string
  boardId: string
  row: DatabaseRow
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
  onClose: () => void
}

export function ProjectTaskPropertiesPanel({
  spaceId,
  boardId,
  row,
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

  return (
    <>
      <div className="space-y-5 p-4">
        <Field label="Status">
          <ProjectTaskSelectField
            property={groupProperty}
            value={row.properties[groupProperty.id]}
            readOnly={readOnly}
            emptyLabel="No status"
            onCommit={(value) =>
              void updateCell.mutateAsync({
                rowId: row.id,
                propertyId: groupProperty.id,
                value,
              })
            }
          />
        </Field>

        {labelProperty ? (
          <Field label="Labels">
            {labelProperty.type === 'multi_select' ? (
              <ProjectTaskMultiSelectField
                property={labelProperty}
                value={row.properties[labelProperty.id]}
                readOnly={readOnly}
                emptyLabel="No labels"
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
                onCommit={(value) =>
                  void updateCell.mutateAsync({
                    rowId: row.id,
                    propertyId: labelProperty.id,
                    value,
                  })
                }
              />
            )}
          </Field>
        ) : null}

        {priorityProperty ? (
          <Field label="Priority">
            <ProjectTaskSelectField
              property={priorityProperty}
              value={row.properties[priorityProperty.id]}
              readOnly={readOnly}
              emptyLabel="No priority"
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: priorityProperty.id,
                  value,
                })
              }
            />
          </Field>
        ) : null}

        {milestoneProperty ? (
          <Field label="Milestone">
            <ProjectTaskSelectField
              property={milestoneProperty}
              value={row.properties[milestoneProperty.id]}
              readOnly={readOnly}
              emptyLabel="No milestone"
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: milestoneProperty.id,
                  value,
                })
              }
            />
          </Field>
        ) : null}

        <Field label="Assignee">
          <ProjectTaskAssigneeField
            value={row.properties.assignee}
            members={members}
            readOnly={readOnly}
            onCommit={(userId) =>
              void updateCell.mutateAsync({
                rowId: row.id,
                propertyId: 'assignee',
                value: userId ?? '',
              })
            }
          />
        </Field>

        <Field label="Due date">
          <ProjectTaskDueDateField
            value={row.properties.due_date}
            readOnly={readOnly}
            onCommit={(value) =>
              void updateCell.mutateAsync({
                rowId: row.id,
                propertyId: 'due_date',
                value,
              })
            }
          />
        </Field>

        {estimateProperty ? (
          <Field label="Estimate">
            <ProjectTaskNumberField
              value={row.properties[estimateProperty.id]}
              readOnly={readOnly}
              placeholder="Points"
              suffix="pts"
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: estimateProperty.id,
                  value,
                })
              }
            />
          </Field>
        ) : null}

        {linkedNoteProperty ? (
          <Field label="Documentation">
            <ProjectTaskDocumentationField
              spaceId={spaceId}
              value={row.properties[linkedNoteProperty.id]}
              pages={pages}
              readOnly={readOnly}
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.id,
                  propertyId: linkedNoteProperty.id,
                  value,
                })
              }
            />
          </Field>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="mt-auto border-t border-border/60 p-4">
          {updatedLabel ? (
            <p className="mb-3 text-[10px] tracking-wide text-text-primary/30">
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
        <div className="mt-auto border-t border-border/60 p-4">
          <p className="text-[10px] tracking-wide text-text-primary/30">Updated {updatedLabel}</p>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
        {label}
      </p>
      {children}
    </div>
  )
}
