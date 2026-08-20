import type { QueryClient } from '@tanstack/react-query'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { applyMoveToFlatPages } from './page-tree-move'
import { buildPageTree, type FlatPage, type PageTreeNode } from './build-tree'
import type { DropPlacement } from './drop-target'

export function collectDescendantIdsFromFlat(
  flatPages: { id: string; parentId: string | null }[],
  rootId: string,
): string[] {
  const childrenByParent = new Map<string, string[]>()

  for (const page of flatPages) {
    if (!page.parentId) continue
    const siblings = childrenByParent.get(page.parentId) ?? []
    siblings.push(page.id)
    childrenByParent.set(page.parentId, siblings)
  }

  const ids: string[] = []
  const stack = [rootId]

  while (stack.length > 0) {
    const id = stack.pop()
    if (!id) continue
    ids.push(id)
    const children = childrenByParent.get(id)
    if (children) stack.push(...children)
  }

  return ids
}

export function collectDescendantIdsFromTree(tree: PageTreeNode[], rootId: string): string[] {
  return collectDescendantIdsFromFlat(flattenPages(tree), rootId)
}

export function appendPageToTreeCache(
  queryClient: QueryClient,
  spaceId: string,
  page: FlatPage,
) {
  queryClient.setQueryData<PageTreeNode[]>(['pages', spaceId], (tree) => {
    if (!tree) return tree

    const flat = flattenPages(tree)
    if (flat.some((entry) => entry.id === page.id)) {
      return tree
    }

    return buildPageTree([...flat, page])
  })
}

export function removePagesFromTreeCache(
  queryClient: QueryClient,
  spaceId: string,
  deletedIds: Iterable<string>,
) {
  const deletedSet = new Set(deletedIds)

  queryClient.setQueryData<PageTreeNode[]>(['pages', spaceId], (tree) => {
    if (!tree) return tree

    const flat = flattenPages(tree).filter((page) => !deletedSet.has(page.id))
    return buildPageTree(flat)
  })

  for (const pageId of deletedSet) {
    queryClient.removeQueries({ queryKey: ['page', spaceId, pageId] })
  }
}

function mapPageIconInTree(nodes: PageTreeNode[], pageId: string, icon: string | null): PageTreeNode[] {
  return nodes.map((node) => {
    if (node.id === pageId) {
      return { ...node, icon }
    }

    if (node.children.length === 0) {
      return node
    }

    return { ...node, children: mapPageIconInTree(node.children, pageId, icon) }
  })
}

export function updatePageIconInTreeCache(
  queryClient: QueryClient,
  spaceId: string,
  pageId: string,
  icon: string | null,
) {
  queryClient.setQueryData<PageTreeNode[]>(['pages', spaceId], (tree) => {
    if (!tree) return tree
    return mapPageIconInTree(tree, pageId, icon)
  })
}

export function movePageInTreeCache(
  queryClient: QueryClient,
  spaceId: string,
  draggedId: string,
  target: PageTreeNode,
  placement: DropPlacement,
) {
  queryClient.setQueryData<PageTreeNode[]>(['pages', spaceId], (tree) => {
    if (!tree) return tree

    const flat = flattenPages(tree)
    const nextFlat = applyMoveToFlatPages(flat, draggedId, target, placement)
    if (!nextFlat) return tree

    return buildPageTree(nextFlat)
  })
}
