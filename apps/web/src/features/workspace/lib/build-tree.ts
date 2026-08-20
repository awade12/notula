import type { PageKind } from '../types/page-kind'

export type FlatPage = {
  id: string
  title: string
  parentId: string | null
  kind: PageKind
  position: string
  icon: string | null
  openCommentCount?: number
}

export type PageTreeNode = {
  id: string
  title: string
  parentId: string | null
  kind: PageKind
  position: string
  icon: string | null
  openCommentCount?: number
  children: PageTreeNode[]
}

export function buildPageTree(pages: FlatPage[]): PageTreeNode[] {
  const byId = new Map<string, PageTreeNode>()

  for (const page of pages) {
    byId.set(page.id, {
      ...page,
      kind: page.kind === 'folder' ? 'folder' : 'note',
      children: [],
    })
  }

  const roots: PageTreeNode[] = []

  for (const page of pages) {
    const node = byId.get(page.id)
    if (!node) continue

    if (page.parentId && byId.has(page.parentId)) {
      byId.get(page.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: PageTreeNode[]) => {
    nodes.sort((a, b) => a.position.localeCompare(b.position))
    for (const node of nodes) {
      sortNodes(node.children)
    }
  }

  sortNodes(roots)
  return roots
}

export function getFolderChildren(
  pages: FlatPage[],
  folderId: string | null,
): FlatPage[] {
  return pages
    .filter((page) => page.parentId === folderId)
    .sort((a, b) => a.position.localeCompare(b.position))
}

export function countDirectChildren(pages: FlatPage[], pageId: string): number {
  return pages.filter((page) => page.parentId === pageId).length
}
