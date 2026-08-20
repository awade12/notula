import type { AiCompletionTemplate, AiQuickAction, RewriteAction, TurnIntoAction } from '../types'

export const AI_QUICK_ACTIONS: AiQuickAction[] = [
  { id: 'summarize', label: 'Summarize', prompt: 'Summarize this page.' },
  { id: 'improve', label: 'Improve', prompt: 'Improve this writing.' },
  { id: 'continue', label: 'Continue', prompt: 'Continue writing from here.' },
  { id: 'shorten', label: 'Shorter', prompt: 'Make this shorter.' },
  { id: 'explain', label: 'Explain', prompt: 'Explain this in simple terms.' },
]

export const TURN_INTO_ACTIONS: TurnIntoAction[] = [
  { id: 'turn_todos', label: 'Todos' },
  { id: 'turn_meeting_notes', label: 'Meeting notes' },
  { id: 'turn_prd', label: 'PRD outline' },
  { id: 'turn_retro', label: 'Retro' },
  { id: 'turn_user_story_map', label: 'User story map' },
]

export const REWRITE_ACTIONS: RewriteAction[] = [
  { id: 'shorten', label: 'Shorter' },
  { id: 'clearer', label: 'Clearer' },
  { id: 'formal', label: 'More formal' },
  { id: 'exec', label: 'For execs' },
  { id: 'engineer', label: 'For engineers' },
  { id: 'grammar', label: 'Fix grammar' },
  { id: 'expand_bullets', label: 'Expand bullets' },
]

export const SLASH_AI_ACTIONS: Array<{
  id: Extract<AiCompletionTemplate, 'summarize' | 'action_items' | 'questions' | 'decision'>
  title: string
  subtext: string
  aliases: string[]
}> = [
  {
    id: 'summarize',
    title: 'Summarize',
    subtext: 'AI summary as blocks',
    aliases: ['summarize', 'summary', 'tl;dr'],
  },
  {
    id: 'action_items',
    title: 'Action items',
    subtext: 'Extract tasks as checkboxes',
    aliases: ['action items', 'actions', 'tasks', 'todo'],
  },
  {
    id: 'questions',
    title: 'Questions',
    subtext: 'Open questions from this page',
    aliases: ['questions', 'open questions'],
  },
  {
    id: 'decision',
    title: 'Decision',
    subtext: 'Decision record block + draft',
    aliases: ['decision', 'decide', 'adr'],
  },
]

export function templateDefaultPrompt(template: AiCompletionTemplate): string {
  switch (template) {
    case 'turn_todos':
      return 'Turn this into todos.'
    case 'turn_meeting_notes':
      return 'Turn this into meeting notes.'
    case 'turn_prd':
      return 'Turn this into a PRD outline.'
    case 'turn_retro':
      return 'Turn this into a retro.'
    case 'turn_user_story_map':
      return 'Turn this into a user story map.'
    case 'action_items':
      return 'Extract action items.'
    case 'questions':
      return 'List open questions.'
    case 'decision':
      return 'Draft a decision record.'
    case 'continue':
      return 'Continue from here.'
    default:
      return 'Rewrite this.'
  }
}
