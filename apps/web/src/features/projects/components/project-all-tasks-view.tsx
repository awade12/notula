import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutGrid } from 'lucide-react'
import type { AllProjectTask } from '../hooks/use-all-project-tasks'
import { cn } from '@/lib/cn'

type ProjectAllTasksViewProps = {
  spaceId: string
  tasks: AllProjectTask[]
  isLoading: boolean
}

export function ProjectAllTasksView({ spaceId, tasks, isLoading }: ProjectAllTasksViewProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <LayoutGrid className="size-8 text-text-primary/30" strokeWidth={1.5} />
        <p className="text-sm text-text-primary/50">No tasks yet across your boards.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <ul className="divide-y divide-border/50">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: '/s/$spaceId/projects/$boardId',
                  params: { spaceId, boardId: task.boardId },
                  search: { task: task.id },
                })
              }
              className={cn(
                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-text-emphasis">{task.title}</span>
                {task.snippet ? (
                  <span className="mt-0.5 block line-clamp-1 text-xs text-text-primary/45">
                    {task.snippet}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right">
                <Link
                  to="/s/$spaceId/projects/$boardId"
                  params={{ spaceId, boardId: task.boardId }}
                  onClick={(event) => event.stopPropagation()}
                  className="block text-[11px] text-text-primary/45 hover:text-text-primary/70"
                >
                  {task.boardTitle}
                </Link>
                {task.dueDate ? (
                  <span className="mt-0.5 block text-[11px] text-text-primary/35">{task.dueDate}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
