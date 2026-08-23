import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DatabaseRow } from '@/features/database/types'
import {
  appendDatabaseRow,
  databaseRowsRootKey,
  removeDatabaseRow,
} from '@/features/database/lib/rows-query-cache'

export function useDuplicateTask(spaceId: string, boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rowId: string) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${boardId}/rows/${rowId}/duplicate`,
        { method: 'POST' },
      )
      if (!response.ok) throw new Error('Failed to duplicate task')
      return (await response.json()) as { row: DatabaseRow }
    },
    onSuccess: (data) => {
      appendDatabaseRow(queryClient, spaceId, boardId, data.row)
    },
  })
}

export function useMoveTaskToBoard(spaceId: string, boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { rowId: string; targetBoardId: string }) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${boardId}/rows/${input.rowId}/move-board`,
        {
          method: 'POST',
          body: JSON.stringify({ targetBoardId: input.targetBoardId }),
        },
      )
      if (!response.ok) throw new Error('Failed to move task')
      return (await response.json()) as { id: string; databaseId: string }
    },
    onSuccess: (_data, input) => {
      removeDatabaseRow(queryClient, spaceId, boardId, input.rowId)
      void queryClient.invalidateQueries({ queryKey: databaseRowsRootKey(spaceId, input.targetBoardId) })
    },
  })
}
