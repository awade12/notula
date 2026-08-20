import { SettingsSection } from '@/features/settings/components/settings-section'
import { ProjectBoardLabelSettings } from './project-board-label-settings'
import { useProjectBoardSettings } from './project-board-settings-context'

export function ProjectBoardLabelsSettingsPage() {
  const { spaceId, boardId, database, canEdit } = useProjectBoardSettings()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Labels"
        description="Labels appear on tasks and in the task panel. Status columns stay separate."
      >
        <ProjectBoardLabelSettings
          spaceId={spaceId}
          boardId={boardId}
          schema={database.schema}
          readOnly={!canEdit}
        />
      </SettingsSection>
    </div>
  )
}
