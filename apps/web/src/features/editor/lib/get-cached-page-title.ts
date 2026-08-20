import type { QueryClient } from '@tanstack/react-query'
import type { PageTreeNode } from '@/features/workspace/lib/build-tree'

function findInTree(nodes: PageTreeNode[], pageId: string): PageTreeNode | null {
  for (const node of nodes) {
    if (node.id === pageId) return node
    const child = findInTree(node.children, pageId)
    if (child) return child
  }
  return null
}

export function getCachedPageTitle(queryClient: QueryClient, spaceId: string, pageId: string) {
  const tree = queryClient.getQueryData<PageTreeNode[]>(['pages', spaceId])
  if (!tree) return ''

  const node = findInTree(tree, pageId)
  if (!node?.title || node.title === 'Untitled') return ''
  return node.title
}
