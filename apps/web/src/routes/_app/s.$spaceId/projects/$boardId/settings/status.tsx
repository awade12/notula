import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardStatusSettingsPage } from '@/features/projects/components/project-board-status-settings-page'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings/status')({
  ssr: false,
  component: ProjectBoardStatusSettingsPage,
})
