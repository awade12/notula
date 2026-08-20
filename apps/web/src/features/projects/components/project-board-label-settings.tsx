import type { DatabaseSchema } from '@notesapp/shared'
import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import { ProjectBoardSelectOptionSettings } from './project-board-select-option-settings'

type ProjectBoardLabelSettingsProps = {
  spaceId: string
  boardId: string
  schema: DatabaseSchema
  readOnly?: boolean
}

export function ProjectBoardLabelSettings({
  spaceId,
  boardId,
  schema,
  readOnly = false,
}: ProjectBoardLabelSettingsProps) {
  return (
    <ProjectBoardSelectOptionSettings
      spaceId={spaceId}
      boardId={boardId}
      schema={schema}
      propertyId={PROJECT_BOARD_PROPERTY_IDS.label}
      emptyMessage="Labels are not available on this board yet. Reload the board to sync the latest schema."
      description=""
      addLabel="New label"
      placeholder="e.g. Bug, Design, Ops"
      readOnly={readOnly}
    />
  )
}
