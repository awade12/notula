export type TaskAiAction = {
  propertyId: string
  value: unknown
  summary: string
}

export type TaskAiProperty = {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'multi_select'
  options?: Array<{ id: string; label: string }>
}

export type TaskAiMember = {
  userId: string
  name: string
}

export type TaskAiMessage = {
  role: 'user' | 'assistant'
  content: string
  actions?: TaskAiAction[]
  appliedSummaries?: string[]
}

export type TaskAiAgentResponse = {
  reply: string
  actions: TaskAiAction[]
}
