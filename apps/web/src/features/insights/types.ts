export type InsightKind = 'decision' | 'signal'

export type Insight = {
  id: string
  kind: InsightKind
  content: string
  status: string
  owner: string
  ownerName?: string
  source: string
  supersedes: string
  supersedesTitle?: string
  supersedesPageId?: string
  dueDate: string
  pageId: string
  pageTitle: string
  spaceId: string
  spaceName?: string
  updatedAt: string
}

export type InsightOptions = {
  members: Array<{
    id: string
    name: string
    email: string
    image: string | null
    role: string
  }>
  decisions: Array<{
    id: string
    content: string
    status: string
    pageId: string
    pageTitle: string
  }>
}
