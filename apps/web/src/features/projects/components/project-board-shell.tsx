import { Link, useSearch } from '@tanstack/react-router'
import { mergeProjectBoardSchema, projectBoardSchemaNeedsMerge } from '@notesapp/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useDatabase } from '@/features/database/hooks/use-database'
import { useDatabaseActions } from '@/features/database/hooks/use-database-actions'
import { useDatabaseCollabProvider } from '@/features/database/hooks/use-database-collab-provider'
import { useDatabaseCollabSync } from '@/features/database/hooks/use-database-collab-sync'
import { useUpdateDatabaseSchema } from '@/features/database/hooks/use-schema-actions'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { useSpaceMembers } from '@/features/workspace/hooks/use-space-members'
import { writeLastProjectBoardId } from '@/features/workspace/lib/workspace-mode'
import { ProjectBoardContent } from '@/features/projects/components/project-board-content'

type ProjectBoardShellProps = {
  spaceId: string
  boardId: string
}

export function ProjectBoardShell({ spaceId, boardId }: ProjectBoardShellProps) {
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/_app/s/$spaceId/projects/$boardId/' })
  const { data: database, isLoading, error } = useDatabase(spaceId, boardId)
  const { data: members = [] } = useSpaceMembers(spaceId)
  const { provider, status: connectionStatus } = useDatabaseCollabProvider(boardId)
  const updateSchema = useUpdateDatabaseSchema(spaceId, boardId)
  const { updateIcon, rename } = useDatabaseActions(spaceId, boardId)
  const canEdit = useCanEditSpace(spaceId)

  useDatabaseCollabSync({ provider, spaceId, databaseId: boardId, queryClient })

  useEffect(() => {
    writeLastProjectBoardId(spaceId, boardId)
  }, [boardId, spaceId])

  useEffect(() => {
    if (!database?.schema || !canEdit) return
    if (!projectBoardSchemaNeedsMerge(database.schema)) return
    void updateSchema.mutateAsync(mergeProjectBoardSchema(database.schema))
  }, [canEdit, database?.schema, updateSchema])

  if (isLoading) {
    return <p className="text-sm text-text-primary/55">Loading board…</p>
  }

  if (error || !database) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm text-text-emphasis">Board not found</p>
        <Link
          to="/s/$spaceId/projects"
          params={{ spaceId }}
          className="mt-3 inline-block text-sm text-text-primary/60 hover:text-text-emphasis"
        >
          Back to boards
        </Link>
      </div>
    )
  }

  return (
    <ProjectBoardContent
      spaceId={spaceId}
      boardId={boardId}
      database={database}
      members={members}
      canEdit={canEdit}
      selectedTaskId={search.task}
      connectionStatus={connectionStatus}
      onRename={(title) => void rename.mutateAsync(title)}
      onUpdateIcon={(icon) => void updateIcon.mutateAsync(icon)}
    />
  )
}
