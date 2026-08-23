export type AiCompletionTemplate =
  | 'ask'
  | 'summarize'
  | 'improve'
  | 'continue'
  | 'shorten'
  | 'explain'
  | 'formal'
  | 'exec'
  | 'engineer'
  | 'grammar'
  | 'expand_bullets'
  | 'clearer'
  | 'turn_todos'
  | 'turn_meeting_notes'
  | 'turn_prd'
  | 'turn_retro'
  | 'turn_user_story_map'
  | 'action_items'
  | 'questions'
  | 'decision'
  | 'ghost'

export type AiCompletionRequest = {
  prompt: string
  spaceId?: string
  pageId?: string
  includeWorkspaceContext?: boolean
  pageTitle?: string
  pageContext?: string
  selection?: string
  template?: AiCompletionTemplate
  model?: string
  maxTokens?: number
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  contextRefs?: Array<
    | { type: 'note'; id: string }
    | { type: 'task'; id: string; boardId: string }
  >
}

export type AiQuickAction = {
  id: AiCompletionTemplate
  label: string
  prompt: string
}

export type TurnIntoAction = {
  id: Extract<
    AiCompletionTemplate,
    'turn_todos' | 'turn_meeting_notes' | 'turn_prd' | 'turn_retro' | 'turn_user_story_map'
  >
  label: string
}

export type RewriteAction = {
  id: Extract<
    AiCompletionTemplate,
    'shorten' | 'clearer' | 'formal' | 'exec' | 'engineer' | 'grammar' | 'expand_bullets'
  >
  label: string
}

export type SlashAiAction = {
  id: Extract<AiCompletionTemplate, 'summarize' | 'action_items' | 'questions' | 'decision'>
  title: string
  aliases: string[]
}

export type PageAiInsights = {
  stale: {
    isStale: boolean
    daysSinceUpdate: number
    backlinkCount: number
  } | null
  duplicates: Array<{
    id: string
    title: string
    icon: string | null
    score: number
  }> | null
  meetingPrep: {
    backlinks: Array<{ id: string; title: string; icon: string | null; updatedAt: string }>
    recentLinkedEdits: Array<{ id: string; title: string; icon: string | null; updatedAt: string }>
    relatedPages: Array<{ id: string; title: string; icon: string | null; score: number }>
  } | null
}
