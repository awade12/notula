import type { PageTreeNode } from './build-tree'

export function findPageAncestorIds(tree: PageTreeNode[], targetId: string): string[] {
  const ancestors: string[] = []

  function walk(nodes: PageTreeNode[], path: string[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        ancestors.push(...path)
        return true
      }
      if (walk(node.children, [...path, node.id])) {
        return true
      }
    }
    return false
  }

  walk(tree, [])
  return ancestors
}
