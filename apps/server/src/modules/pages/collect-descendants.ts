type PageNode = {
  id: string
  parentId: string | null
}

export function collectDescendantIds(flatPages: PageNode[], rootId: string): string[] {
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
