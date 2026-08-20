import type { PageTreeNode } from './build-tree'

export function updateTreeNodeTitle(
  nodes: PageTreeNode[],
  pageId: string,
  title: string,
): PageTreeNode[] {
  let changed = false

  const next = nodes.map((node) => {
    if (node.id === pageId) {
      if (node.title === title) return node
      changed = true
      return { ...node, title }
    }

    if (node.children.length === 0) {
      return node
    }

    const children = updateTreeNodeTitle(node.children, pageId, title)
    if (children !== node.children) {
      changed = true
      return { ...node, children }
    }

    return node
  })

  return changed ? next : nodes
}
