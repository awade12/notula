import { Link, Outlet } from '@tanstack/react-router'
import { mergeProjectBoardSchema, projectBoardSchemaNeedsMerge } from '@notesapp/shared'
import { useEffect } from 'react'
import { useDatabase } from '@/features/database/hooks/use-database'
import { useUpdateDatabaseSchema } from '@/features/database/hooks/use-schema-actions'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { ProjectBoardSettingsNav } from './project-board-settings-nav'
import { ProjectBoardSettingsProvider } from './project-board-settings-context'

type ProjectBoardSettingsLayoutProps = {
  spaceId: string
  boardId: string
}

export function ProjectBoardSettingsLayout({ spaceId, boardId }: ProjectBoardSettingsLayoutProps) {
  const { data: database, isLoading, error } = useDatabase(spaceId, boardId)
  const updateSchema = useUpdateDatabaseSchema(spaceId, boardId)
  const canEdit = useCanEditSpace(spaceId)

  useEffect(() => {
    if (!database?.schema || !canEdit) return
    if (!projectBoardSchemaNeedsMerge(database.schema)) return
    void updateSchema.mutateAsync(mergeProjectBoardSchema(database.schema))
  }, [canEdit, database?.schema, updateSchema])

  if (isLoading) {
    return <p className="text-sm text-text-primary">Loading board settings…</p>
  }

  if (error || !database) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm text-text-emphasis">Board not found</p>
        <Link
          to="/s/$spaceId/projects"
          params={{ spaceId }}
          className="mt-3 inline-block text-sm text-text-primary hover:text-text-emphasis"
        >
          Back to boards
        </Link>
      </div>
    )
  }

  return (
    <ProjectBoardSettingsProvider
      spaceId={spaceId}
      boardId={boardId}
      database={database}
      canEdit={canEdit}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-center pb-6 pt-0">
        <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-5 lg:gap-6">
          <header className="shrink-0 text-center lg:text-left">
            <Link
              to="/s/$spaceId/projects/$boardId"
              params={{ spaceId, boardId }}
              className="inline-flex text-xs tracking-dashboard text-text-primary/45 transition-colors hover:text-text-emphasis"
            >
              ← Back to {database.title}
            </Link>
            <div className="mt-2">
              <p className="text-meta tracking-dashboard text-text-primary">Projects</p>
              <h1 className="mt-0.5 text-2xl font-medium tracking-dashboard text-text-emphasis">
                Board settings
              </h1>
              <p className="mx-auto mt-1.5 max-w-2xl text-sm tracking-dashboard text-text-primary lg:mx-0">
                Labels, milestones, and public sharing for {database.title}.
              </p>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
            <ProjectBoardSettingsNav spaceId={spaceId} boardId={boardId} />
            <div className="scrollbar-none min-h-0 min-w-0 overflow-y-auto pr-1">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </ProjectBoardSettingsProvider>
  )
}
