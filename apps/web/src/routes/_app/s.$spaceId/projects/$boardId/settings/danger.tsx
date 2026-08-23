import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardDangerSettingsPage } from '@/features/projects/components/project-board-danger-settings-page'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings/danger')({
  ssr: false,
  component: ProjectBoardDangerSettingsPage,
})
