import { findProperty } from '@notesapp/shared'
import { useMemo } from 'react'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { ProjectKanbanView } from '@/features/projects/components/project-kanban-view'
import type { PublicBoardPayload } from '@/features/projects/hooks/use-public-board'

type PublicProjectBoardShellProps = {
  payload: PublicBoardPayload
}

export function PublicProjectBoardShell({ payload }: PublicProjectBoardShellProps) {
  const { database, rows } = payload
  const boardView = database.views.find((view) => view.type === 'board') ?? database.views[0]

  const groupProperty = useMemo(() => {
    if (!boardView?.config.groupByPropertyId) return undefined
    return findProperty(database.schema.properties, boardView.config.groupByPropertyId)
  }, [boardView, database.schema.properties])

  const titleProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'title'),
    [database.schema.properties],
  )

  const labelProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'label'),
    [database.schema.properties],
  )

  const milestoneProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'milestone'),
    [database.schema.properties],
  )

  const priorityProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'priority'),
    [database.schema.properties],
  )

  const linkedNoteProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'linked_note'),
    [database.schema.properties],
  )

  if (!boardView || !groupProperty || groupProperty.type !== 'select' || !titleProperty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar px-6">
        <p className="text-sm text-text-primary/55">This board is not ready to display publicly.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sidebar">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
              {database.icon ? (
                <PageIconDisplay value={database.icon} size={22} />
              ) : (
                <span className="text-lg text-text-primary/35">📋</span>
              )}
            </span>
            <div className="min-w-0">
              <p className="text-meta tracking-dashboard text-text-primary/45">Public board</p>
              <h1 className="mt-1 text-2xl font-medium tracking-dashboard text-text-emphasis">
                {database.title}
              </h1>
              <p className="mt-1 text-xs tracking-dashboard text-text-primary/45">
                Read-only · {rows.length} tasks
              </p>
            </div>
          </div>
        </header>

        <ProjectKanbanView
          spaceId={database.spaceId}
          databaseId={database.id}
          rows={rows}
          groupProperty={groupProperty}
          titleProperty={titleProperty}
          labelProperty={labelProperty}
          milestoneProperty={milestoneProperty}
          priorityProperty={priorityProperty}
          linkedNoteProperty={linkedNoteProperty}
          readOnly
          onOpenTask={() => {}}
        />
      </div>
    </div>
  )
}
