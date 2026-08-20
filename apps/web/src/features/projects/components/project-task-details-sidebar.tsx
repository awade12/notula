import { useEffect, useState, type ReactNode } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { useTaskSidebarWidth } from '../hooks/use-task-sidebar-width'
import { taskAiIcon } from '../lib/project-icon-pack'
import { ProjectTaskAiTab } from './project-task-ai-tab'
import { ProjectTaskPropertiesPanel } from './project-task-properties-panel'
import { ProjectTaskSidebarResizeHandle } from './project-task-sidebar-resize-handle'

export type ProjectTaskSidebarTab = 'properties' | 'ai'

type ProjectTaskDetailsSidebarProps = {
  spaceId: string
  boardId: string
  row: DatabaseRow
  groupProperty: PropertyDefinition
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  estimateProperty?: PropertyDefinition
  linkedNoteProperty?: PropertyDefinition
  pages: FlatPage[]
  members: SpaceMember[]
  taskTitle: string
  taskContext: string
  schemaProperties: PropertyDefinition[]
  updatedLabel?: string | null
  readOnly?: boolean
  onClose: () => void
}

export function ProjectTaskDetailsSidebar({
  spaceId,
  boardId,
  row,
  groupProperty,
  labelProperty,
  milestoneProperty,
  priorityProperty,
  estimateProperty,
  linkedNoteProperty,
  pages,
  members,
  taskTitle,
  taskContext,
  schemaProperties,
  updatedLabel,
  readOnly = false,
  onClose,
}: ProjectTaskDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<ProjectTaskSidebarTab>('properties')
  const { width, onResizePointerDown } = useTaskSidebarWidth()

  useEffect(() => {
    setActiveTab('properties')
  }, [row.id])

  return (
    <aside
      style={{ width }}
      className="relative flex shrink-0 flex-col overflow-hidden border-l border-border/60 bg-sidebar"
    >
      <ProjectTaskSidebarResizeHandle onPointerDown={onResizePointerDown} />
      <div className="flex shrink-0 gap-1 border-b border-border/60 p-2">
        <SidebarTab active={activeTab === 'properties'} onClick={() => setActiveTab('properties')}>
          Properties
        </SidebarTab>
        <SidebarTab active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
          <WorkspaceIcon icon={taskAiIcon} size={iconSize.section} />
          AI
        </SidebarTab>
      </div>

      {activeTab === 'properties' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <ProjectTaskPropertiesPanel
            spaceId={spaceId}
            boardId={boardId}
            row={row}
            groupProperty={groupProperty}
            labelProperty={labelProperty}
            milestoneProperty={milestoneProperty}
            priorityProperty={priorityProperty}
            estimateProperty={estimateProperty}
            linkedNoteProperty={linkedNoteProperty}
            pages={pages}
            members={members}
            updatedLabel={updatedLabel}
            readOnly={readOnly}
            onClose={onClose}
          />
        </div>
      ) : (
        <ProjectTaskAiTab
          spaceId={spaceId}
          boardId={boardId}
          rowId={row.id}
          taskTitle={taskTitle}
          taskContext={taskContext}
          schemaProperties={schemaProperties}
          members={members}
          readOnly={readOnly}
          variant="sidebar"
        />
      )}
    </aside>
  )
}

function SidebarTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs tracking-dashboard transition-colors',
        active
          ? 'bg-white/[0.08] text-text-emphasis'
          : 'text-text-primary/50 hover:bg-white/[0.04] hover:text-text-primary/75',
      )}
    >
      {children}
    </button>
  )
}
