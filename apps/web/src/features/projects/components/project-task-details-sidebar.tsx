import { useEffect, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { cn } from '@/lib/cn'
import { useTaskSidebarWidth } from '../hooks/use-task-sidebar-width'
import { ProjectTaskActivityTab } from './project-task-activity-tab'
import { ProjectTaskAiTab } from './project-task-ai-tab'
import { ProjectTaskPropertiesPanel } from './project-task-properties-panel'
import { ProjectTaskSidebarResizeHandle } from './project-task-sidebar-resize-handle'
import {
  ProjectTaskSidebarTabs,
  type ProjectTaskSidebarTab,
} from './project-task-sidebar-tabs'

export type { ProjectTaskSidebarTab } from './project-task-sidebar-tabs'

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
  linkedPageId?: string
  linkedPageTitle?: string
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
  linkedPageId,
  linkedPageTitle,
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
      <ProjectTaskSidebarTabs activeTab={activeTab} onChange={setActiveTab} />

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden',
          activeTab !== 'properties' && 'hidden',
        )}
      >
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

      <div className={cn('flex min-h-0 flex-1 flex-col', activeTab !== 'activity' && 'hidden')}>
        <ProjectTaskActivityTab
          spaceId={spaceId}
          boardId={boardId}
          rowId={row.id}
          readOnly={readOnly}
        />
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col', activeTab !== 'ai' && 'hidden')}>
        <ProjectTaskAiTab
          spaceId={spaceId}
          boardId={boardId}
          rowId={row.id}
          taskTitle={taskTitle}
          taskContext={taskContext}
          linkedPageId={linkedPageId}
          linkedPageTitle={linkedPageTitle}
          schemaProperties={schemaProperties}
          members={members}
          assigneeId={
            typeof row.properties.assignee === 'string' ? row.properties.assignee : null
          }
          readOnly={readOnly}
          variant="sidebar"
        />
      </div>
    </aside>
  )
}
