import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Page } from '@/features/editor/hooks/use-page'
import { apiFetch } from '@/lib/api'
import {
  appendPageToTreeCache,
  collectDescendantIdsFromTree,
  removePagesFromTreeCache,
  updatePageIconInTreeCache,
} from '../lib/update-page-tree-cache'
import type { PageTreeNode } from '../lib/build-tree'
import type { PageKind } from '../types/page-kind'

type CreatedPage = {
  id: string
  parentId: string | null
  kind: PageKind
  title: string
  position: string
  icon: string | null
}

function parseCreatedPage(raw: {
  id: string
  parentId: string | null
  kind: string
  title: string
  position: string
  icon?: string | null
}): CreatedPage {
  return {
    id: raw.id,
    parentId: raw.parentId,
    kind: raw.kind === 'folder' ? 'folder' : 'note',
    title: raw.title,
    position: raw.position,
    icon: raw.icon ?? null,
  }
}

async function readApiError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? fallback
}

export function usePageActions(spaceId: string) {
  const queryClient = useQueryClient()

  const invalidatePages = () => {
    void queryClient.invalidateQueries({ queryKey: ['pages', spaceId] })
  }

  const rename = useMutation({
    mutationFn: async ({ pageId, title }: { pageId: string; title: string }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error('Failed to rename page')
      return response.json()
    },
    onSuccess: invalidatePages,
  })

  const updateIcon = useMutation({
    mutationFn: async ({ pageId, icon }: { pageId: string; icon: string | null }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ icon }),
      })
      if (!response.ok) throw new Error('Failed to update icon')
      const data = (await response.json()) as { page: Page }
      return data.page
    },
    onMutate: async ({ pageId, icon }) => {
      await queryClient.cancelQueries({ queryKey: ['page', spaceId, pageId] })

      const previousPage = queryClient.getQueryData<Page>(['page', spaceId, pageId])
      const previousTree = queryClient.getQueryData<PageTreeNode[]>(['pages', spaceId])

      queryClient.setQueryData<Page>(['page', spaceId, pageId], (current) =>
        current ? { ...current, icon } : current,
      )
      updatePageIconInTreeCache(queryClient, spaceId, pageId, icon)

      return { previousPage, previousTree }
    },
    onError: (_error, { pageId }, context) => {
      if (context?.previousPage) {
        queryClient.setQueryData(['page', spaceId, pageId], context.previousPage)
      }
      if (context?.previousTree) {
        queryClient.setQueryData(['pages', spaceId], context.previousTree)
      }
    },
    onSuccess: (page) => {
      queryClient.setQueryData(['page', spaceId, page.id], page)
      updatePageIconInTreeCache(queryClient, spaceId, page.id, page.icon)
    },
  })

  const convertKind = useMutation({
    mutationFn: async ({ pageId, kind }: { pageId: string; kind: PageKind }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ kind }),
      })
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to convert page'))
      }
      return response.json()
    },
    onSuccess: invalidatePages,
  })

  const remove = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to delete page'))
      }
      return response.json() as Promise<{ deletedIds: string[] }>
    },
    onMutate: async (pageId) => {
      await queryClient.cancelQueries({ queryKey: ['pages', spaceId] })

      const previousTree = queryClient.getQueryData<PageTreeNode[]>(['pages', spaceId])
      const optimisticDeletedIds = previousTree
        ? collectDescendantIdsFromTree(previousTree, pageId)
        : [pageId]

      removePagesFromTreeCache(queryClient, spaceId, optimisticDeletedIds)

      return { previousTree, optimisticDeletedIds }
    },
    onError: (_error, _pageId, context) => {
      if (context?.previousTree) {
        queryClient.setQueryData(['pages', spaceId], context.previousTree)
      }
    },
    onSuccess: (result) => {
      removePagesFromTreeCache(queryClient, spaceId, result.deletedIds)
    },
  })

  const createPage = useMutation({
    mutationFn: async ({
      parentId = null,
      title,
      kind = 'note',
    }: {
      parentId?: string | null
      title?: string
      kind?: PageKind
    }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages`, {
        method: 'POST',
        body: JSON.stringify({
          parentId,
          title,
          kind,
        }),
      })
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to create page'))
      }
      const raw = (await response.json()) as {
        id: string
        parentId: string | null
        kind: string
        title: string
        position: string
        icon?: string | null
      }
      return parseCreatedPage(raw)
    },
    onSuccess: (page) => {
      appendPageToTreeCache(queryClient, spaceId, page)
      queryClient.setQueryData(['page', spaceId, page.id], {
        id: page.id,
        spaceId,
        parentId: page.parentId,
        kind: page.kind,
        title: page.title,
        position: page.position,
        icon: page.icon,
        plaintext: '',
        updatedAt: new Date().toISOString(),
      })
    },
  })

  return { rename, updateIcon, convertKind, remove, createPage, createSubPage: createPage }
}
