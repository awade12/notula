import type { TaskAiCreateTask } from '@/features/projects/lib/task-ai-types'

type ProjectBoardIdeaTaskPreviewListProps = {
  tasks: TaskAiCreateTask[]
}

export function ProjectBoardIdeaTaskPreviewList({ tasks }: ProjectBoardIdeaTaskPreviewListProps) {
  if (tasks.length === 0) return null

  return (
    <ul className="space-y-2">
      {tasks.map((task, index) => (
        <li
          key={`${task.title}-${index}`}
          className="rounded-md border border-border/60 px-3 py-2 text-xs"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-white/[0.06] text-[10px] text-text-primary/45">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-text-emphasis">{task.title}</span>
              {task.description ? (
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-text-primary/45">
                  {task.description}
                </p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {task.status ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-primary/50">
                    status
                  </span>
                ) : null}
                {task.labelIds?.length ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-primary/50">
                    {task.labelIds.length} label{task.labelIds.length === 1 ? '' : 's'}
                  </span>
                ) : null}
                {task.milestone ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-primary/50">
                    milestone
                  </span>
                ) : null}
                {task.priority ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-primary/50">
                    priority
                  </span>
                ) : null}
                {task.estimate != null ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-primary/50">
                    {task.estimate} pts
                  </span>
                ) : null}
                {task.dueDate ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-primary/50">
                    due {task.dueDate}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
