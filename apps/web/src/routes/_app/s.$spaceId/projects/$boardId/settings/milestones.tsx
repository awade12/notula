import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardMilestonesSettingsPage } from '@/features/projects/components/project-board-milestones-settings-page'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings/milestones')({
  component: ProjectBoardMilestonesSettingsPage,
})
