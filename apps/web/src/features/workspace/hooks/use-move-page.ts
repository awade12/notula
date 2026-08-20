import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { buildMovePayload, type MovePageInput } from '../lib/build-move-payload'
import type { PageTreeNode } from '../lib/build-tree'
import type { DropPlacement } from '../lib/drop-target'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { movePageInTreeCache } from '../lib/update-page-tree-cache'

export type MovePageMutationInput = MovePageInput & {
  target: PageTreeNode
  placement: DropPlacement
}

export function useMovePage(spaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ target: _target, placement: _placement, ...input }: MovePageMutationInput) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/pages/${input.pageId}/move`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            parentId: input.parentId,
            beforeId: input.beforeId,
            afterId: input.afterId,
          }),
        },
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to move page')
      }

      return response.json()
    },
    onMutate: async ({ pageId, target, placement }) => {
      await queryClient.cancelQueries({ queryKey: ['pages', spaceId] })

      const previousTree = queryClient.getQueryData<PageTreeNode[]>(['pages', spaceId])
      movePageInTreeCache(queryClient, spaceId, pageId, target, placement)

      return { previousTree }
    },
    onError: (_error, _input, context) => {
      if (context?.previousTree) {
        queryClient.setQueryData(['pages', spaceId], context.previousTree)
      }
    },
  })
}

export function prepareMoveMutation(
  spaceId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  draggedId: string,
  target: PageTreeNode,
  placement: DropPlacement,
): MovePageMutationInput | null {
  const tree = queryClient.getQueryData<PageTreeNode[]>(['pages', spaceId])
  if (!tree) return null

  const payload = buildMovePayload(flattenPages(tree), draggedId, target, placement)
  if (!payload) return null

  return { ...payload, target, placement }
}

export { buildMovePayload } from '../lib/build-move-payload'
