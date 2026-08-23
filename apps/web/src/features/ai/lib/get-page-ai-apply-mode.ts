import type { AiCompletionTemplate } from '../types'
import type { PageAiApplyMode } from '../types/page-ai'

const REPLACE_TEMPLATES = new Set<AiCompletionTemplate>([
  'improve',
  'shorten',
  'explain',
  'formal',
  'exec',
  'engineer',
  'grammar',
  'expand_bullets',
  'clearer',
  'turn_todos',
  'turn_meeting_notes',
  'turn_prd',
  'turn_retro',
  'turn_user_story_map',
])

const REWRITE_PROMPT =
  /\b(improve|rewrite|revise|rework|polish|clean up|fix (this|the page|it)|make (this|the page|it) better|make (this|the page) (clearer|shorter|better))\b/i

export function getPageAiApplyMode(input: {
  template?: AiCompletionTemplate
  hasSelection: boolean
  prompt: string
}): PageAiApplyMode {
  if (input.hasSelection) return 'replace-selection'

  if (input.template && REPLACE_TEMPLATES.has(input.template)) {
    return 'replace-page'
  }

  if (REWRITE_PROMPT.test(input.prompt)) {
    return 'replace-page'
  }

  return 'insert'
}

export function pageAiApplyLabel(mode: PageAiApplyMode) {
  switch (mode) {
    case 'replace-page':
      return 'Replace page'
    case 'replace-selection':
      return 'Replace selection'
    case 'insert':
      return 'Insert into page'
  }
}
