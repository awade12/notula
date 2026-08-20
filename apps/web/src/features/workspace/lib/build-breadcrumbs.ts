import type { PageKind } from '../types/page-kind'
import type { FlatPage } from './build-tree'

export type BreadcrumbItem = {
  id: string | null
  title: string
  kind?: PageKind
  icon?: string | null
}

export function buildBreadcrumbs(
  pages: FlatPage[],
  folderId: string | null,
  spaceTitle: string,
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ id: null, title: spaceTitle }]
  if (!folderId) return crumbs

  const byId = new Map(pages.map((page) => [page.id, page]))
  const trail: FlatPage[] = []
  let current = byId.get(folderId)

  while (current) {
    trail.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  for (const page of trail) {
    crumbs.push({
      id: page.id,
      title: page.title,
      kind: page.kind,
      icon: page.icon,
    })
  }

  return crumbs
}
