import type { AiWorkspaceCitation } from '../lib/teamspace-ask-page'

export type PageAiApplyMode = 'replace-page' | 'replace-selection' | 'insert'

export type PageAiContextRef =
  | { type: 'note'; id: string; title: string }
  | { type: 'task'; id: string; boardId: string; title: string; boardTitle?: string }

export type PageAiMessage = {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  applyMode?: PageAiApplyMode
  citations?: AiWorkspaceCitation[]
  sourceContent?: string
}

export type PageAiThread = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: PageAiMessage[]
}

export type PageAiThreadStore = {
  activeThreadId: string
  threads: PageAiThread[]
}
