import { SettingsSection } from '@/features/settings/components/settings-section'
import { ProjectBoardMilestoneSettings } from './project-board-milestone-settings'
import { useProjectBoardSettings } from './project-board-settings-context'

export function ProjectBoardMilestonesSettingsPage() {
  const { spaceId, boardId, database, canEdit } = useProjectBoardSettings()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Milestones"
        description="Track release targets like v1.4.5 on each task. Add sprints or versions here."
      >
        <ProjectBoardMilestoneSettings
          spaceId={spaceId}
          boardId={boardId}
          schema={database.schema}
          readOnly={!canEdit}
        />
      </SettingsSection>
    </div>
  )
}
