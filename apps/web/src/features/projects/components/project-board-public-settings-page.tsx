import { SettingsSection } from '@/features/settings/components/settings-section'
import { ProjectBoardPublicSettings } from './project-board-public-settings'
import { useProjectBoardSettings } from './project-board-settings-context'

export function ProjectBoardPublicSettingsPage() {
  const { spaceId, boardId, database, canEdit } = useProjectBoardSettings()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Public board"
        description="Publish a read-only view of this board at a shareable URL."
      >
        <ProjectBoardPublicSettings
          spaceId={spaceId}
          boardId={boardId}
          boardTitle={database.title}
          isPublic={database.isPublic ?? false}
          publicSlug={database.publicSlug ?? null}
          readOnly={!canEdit}
        />
      </SettingsSection>
    </div>
  )
}
