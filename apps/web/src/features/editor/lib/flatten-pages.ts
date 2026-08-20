import type { FlatPage, PageTreeNode } from '@/features/workspace/lib/build-tree'

export function flattenPages(tree: PageTreeNode[]): FlatPage[] {
  const result: FlatPage[] = []

  const walk = (nodes: PageTreeNode[]) => {
    for (const node of nodes) {
      const { children, ...page } = node
      result.push(page)
      walk(children)
    }
  }

  walk(tree)
  return result
}
