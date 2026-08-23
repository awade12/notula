import { createFileRoute } from '@tanstack/react-router'
import { ProjectAllTasksView } from '@/features/projects/components/project-all-tasks-view'
import { useAllProjectTasks } from '@/features/projects/hooks/use-all-project-tasks'

export const Route = createFileRoute('/_app/s/$spaceId/projects/all')({
  ssr: false,
  component: ProjectAllTasksRoute,
})

function ProjectAllTasksRoute() {
  const { spaceId } = Route.useParams()
  const { data: tasks = [], isLoading } = useAllProjectTasks(spaceId)

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 px-6 py-6">
      <div>
        <h1 className="text-lg font-medium tracking-dashboard text-text-emphasis">All tasks</h1>
        <p className="mt-1 text-sm text-text-primary/50">
          Every open task across boards in this teamspace.
        </p>
      </div>
      <ProjectAllTasksView spaceId={spaceId} tasks={tasks} isLoading={isLoading} />
    </div>
  )
}
