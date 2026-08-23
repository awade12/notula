import type { AiWorkspaceCitation } from '../lib/teamspace-ask-page'

export type TeamspaceAskMessage = {
  role: 'user' | 'assistant'
  content: string
  citations?: AiWorkspaceCitation[]
}

export type TeamspaceAskRequest = {
  spaceId: string
  prompt: string
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
  contextRefs?: Array<
    | { type: 'note'; id: string }
    | { type: 'task'; id: string; boardId: string }
  >
}
