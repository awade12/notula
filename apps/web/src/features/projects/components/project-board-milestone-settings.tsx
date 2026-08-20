import type { DatabaseSchema } from '@notesapp/shared'
import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import { ProjectBoardSelectOptionSettings } from './project-board-select-option-settings'

type ProjectBoardMilestoneSettingsProps = {
  spaceId: string
  boardId: string
  schema: DatabaseSchema
  readOnly?: boolean
}

export function ProjectBoardMilestoneSettings({
  spaceId,
  boardId,
  schema,
  readOnly = false,
}: ProjectBoardMilestoneSettingsProps) {
  return (
    <ProjectBoardSelectOptionSettings
      spaceId={spaceId}
      boardId={boardId}
      schema={schema}
      propertyId={PROJECT_BOARD_PROPERTY_IDS.milestone}
      emptyMessage="Milestones are not available on this board yet. Reload the board to sync the latest schema."
      description=""
      addLabel="New milestone"
      placeholder="e.g. v1.4.5, v1.5.0"
      readOnly={readOnly}
    />
  )
}
