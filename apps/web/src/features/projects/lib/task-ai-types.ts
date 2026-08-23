export type TaskAiAction = {
  propertyId: string
  value: unknown
  summary: string
}

export type TaskAiCreateTask = {
  title: string
  description?: string
  status?: string
  assigneeIds?: string[]
  assigneeId?: string | null
  labelIds?: string[]
}

export type TaskAiProperty = {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'multi_select' | 'relation'
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
  createTasks?: TaskAiCreateTask[]
  appliedSummaries?: string[]
  appliedCreateTitles?: string[]
}

export type TaskAiAgentResponse = {
  reply: string
  actions: TaskAiAction[]
  createTasks?: TaskAiCreateTask[]
}
