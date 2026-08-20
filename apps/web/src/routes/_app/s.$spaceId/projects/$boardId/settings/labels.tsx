import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardLabelsSettingsPage } from '@/features/projects/components/project-board-labels-settings-page'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings/labels')({
  component: ProjectBoardLabelsSettingsPage,
})
