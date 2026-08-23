import { useNavigate } from '@tanstack/react-router'
import { SettingsSection } from '@/features/settings/components/settings-section'
import { useDatabaseActions } from '@/features/database/hooks/use-database-actions'
import { useProjectBoardSettings } from './project-board-settings-context'

export function ProjectBoardDangerSettingsPage() {
  const { spaceId, boardId, database, canEdit } = useProjectBoardSettings()
  const navigate = useNavigate()
  const { remove } = useDatabaseActions(spaceId, boardId)

  async function handleDelete() {
    if (!canEdit || remove.isPending) return
    const confirmed = window.confirm(
      `Delete "${database.title}" and all of its tasks? This cannot be undone.`,
    )
    if (!confirmed) return

    await remove.mutateAsync()
    void navigate({ to: '/s/$spaceId/projects', params: { spaceId } })
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Delete board"
        description="Permanently remove this board and every task on it."
      >
        <button
          type="button"
          disabled={!canEdit || remove.isPending}
          onClick={() => void handleDelete()}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-40"
        >
          {remove.isPending ? 'Deleting…' : 'Delete board'}
        </button>
      </SettingsSection>
    </div>
  )
}
