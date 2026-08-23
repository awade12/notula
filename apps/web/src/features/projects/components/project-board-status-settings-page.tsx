import { SettingsSection } from '@/features/settings/components/settings-section'
import { ProjectBoardStatusSettings } from './project-board-status-settings'
import { useProjectBoardSettings } from './project-board-settings-context'

export function ProjectBoardStatusSettingsPage() {
  const { spaceId, boardId, database, canEdit } = useProjectBoardSettings()
  const boardView = database.views.find((view) => view.type === 'board') ?? database.views[0]

  if (!boardView) {
    return <p className="text-sm text-text-primary/45">This board has no views yet.</p>
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Status columns"
        description="Kanban lanes map to status options. Reorder columns, rename them, or hide lanes you don't need."
      >
        <ProjectBoardStatusSettings
          spaceId={spaceId}
          boardId={boardId}
          schema={database.schema}
          boardView={boardView}
          readOnly={!canEdit}
        />
      </SettingsSection>
    </div>
  )
}
