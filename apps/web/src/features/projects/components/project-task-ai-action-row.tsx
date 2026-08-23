import { useState } from 'react'
import { AiMarkdownBody } from '@/features/ai/components/ai-markdown-body'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import {
  formatTaskAiActionPreview,
  isLongTaskAiPreview,
} from '@/features/projects/lib/format-task-ai-action-preview'
import type { TaskAiAction, TaskAiMember, TaskAiProperty } from '@/features/projects/lib/task-ai-types'
import { taskCheckIcon, taskLoadingIcon } from '@/features/projects/lib/project-icon-pack'

type ProjectTaskAiActionRowProps = {
  spaceId: string
  action: TaskAiAction
  properties: TaskAiProperty[]
  members?: TaskAiMember[]
  isApplied: boolean
  isApplying: boolean
  readOnly: boolean
  disabled: boolean
  onApply: () => void
}

export function ProjectTaskAiActionRow({
  spaceId,
  action,
  properties,
  members,
  isApplied,
  isApplying,
  readOnly,
  disabled,
  onApply,
}: ProjectTaskAiActionRowProps) {
  const preview = formatTaskAiActionPreview({ action, properties, members })
  const isLong = isLongTaskAiPreview(preview)
  const [expanded, setExpanded] = useState(false)

  return (
    <li className="px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-primary/45">
              {preview.fieldName}
            </span>
            <p
              className={cn(
                'text-[13px] font-medium leading-snug',
                isApplied ? 'text-text-primary/40 line-through' : 'text-text-primary/85',
              )}
            >
              {preview.summary}
            </p>
          </div>

          <div
            className={cn(
              'relative overflow-hidden rounded-lg border border-border/35 bg-white/[0.02]',
              !expanded && isLong && 'max-h-32',
            )}
          >
            <div className="px-2.5 py-2">
              {preview.markdownPreview ? (
                <AiMarkdownBody
                  content={preview.markdownPreview}
                  spaceId={spaceId}
                  className="text-[12px] leading-[1.65] text-text-primary/60 [&_p]:text-text-primary/60 [&_li]:text-text-primary/60"
                />
              ) : (
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-text-primary/60">
                  {preview.plainPreview}
                </p>
              )}
            </div>

            {!expanded && isLong ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-sidebar to-transparent" />
            ) : null}
          </div>

          {isLong ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="text-[11px] text-text-primary/45 transition-colors hover:text-text-primary/70"
            >
              {expanded ? 'Show less' : 'Show full preview'}
            </button>
          ) : null}
        </div>

        <div className="shrink-0 pt-0.5">
          {isApplied ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-green-400/85">
              <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} />
              Done
            </span>
          ) : (
            <button
              type="button"
              disabled={readOnly || disabled}
              onClick={onApply}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                'bg-text-emphasis text-sidebar hover:opacity-90 disabled:opacity-40',
              )}
            >
              {isApplying ? (
                <WorkspaceIcon
                  icon={taskLoadingIcon}
                  size={iconSize.section}
                  className="animate-spin"
                />
              ) : null}
              Apply
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
