import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardPublicSettingsPage } from '@/features/projects/components/project-board-public-settings-page'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings/public')({
  component: ProjectBoardPublicSettingsPage,
})
