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

type BuildMessagesInput = {
  prompt: string
  pageTitle?: string
  pageContext?: string
  selection?: string
  template?: AiCompletionTemplate
}

const SYSTEM_PROMPT = `You are a writing assistant inside a notes app. Be concise and useful. Use markdown when it helps (headings, lists, checkboxes). Do not wrap the whole answer in a code fence.`

function templateInstruction(template: AiCompletionTemplate) {
  switch (template) {
    case 'summarize':
      return 'Summarize the page content clearly in a few short paragraphs or bullet points.'
    case 'improve':
      return 'Improve the writing for clarity and flow. Preserve meaning and tone.'
    case 'continue':
      return 'Continue writing naturally from where the page or selection leaves off. Match voice and structure. Output only the new continuation — no preamble.'
    case 'shorten':
      return 'Make the content shorter while keeping the key points.'
    case 'explain':
      return 'Explain the content in plain language for someone new to the topic.'
    case 'formal':
      return 'Rewrite in a more formal, professional tone. Keep the same meaning.'
    case 'exec':
      return 'Rewrite for executives: lead with outcome, minimize jargon, keep it scannable with short paragraphs or bullets.'
    case 'engineer':
      return 'Rewrite for engineers: be precise, include technical detail where relevant, use clear structure (bullets, code terms where appropriate).'
    case 'grammar':
      return 'Fix grammar, spelling, and punctuation. Preserve meaning and tone; change as little as possible beyond corrections.'
    case 'expand_bullets':
      return 'Expand bullet points into clear prose paragraphs. One paragraph per major bullet where sensible.'
    case 'clearer':
      return 'Rewrite to be shorter and clearer. Remove filler and redundancy.'
    case 'turn_todos':
      return `Restructure this content as an actionable todo list. Use markdown checkboxes (- [ ] item). Group under ## headings if helpful. Extract concrete tasks only.`
    case 'turn_meeting_notes':
      return `Restructure as meeting notes with ## Attendees (if inferable), ## Agenda, ## Discussion, ## Action items (checkboxes), ## Decisions. Use markdown headings and lists.`
    case 'turn_prd':
      return `Restructure as a PRD outline: ## Problem, ## Goals, ## Non-goals, ## Users, ## Requirements, ## Success metrics, ## Open questions. Use bullets under each heading.`
    case 'turn_retro':
      return `Restructure as a retrospective: ## What went well, ## What didn't, ## Action items (checkboxes). Be specific to the content provided.`
    case 'turn_user_story_map':
      return `Restructure as a user story map: ## Backbone (user activities as ## headings), under each add ### Stories as bullet user stories ("As a… I want… so that…").`
    case 'action_items':
      return 'Extract action items only. Output as markdown checkbox list (- [ ] owner optional). No other commentary.'
    case 'questions':
      return 'List open questions raised by this content. Use a markdown bullet list. Be specific.'
    case 'decision':
      return 'Draft a concise decision record: what was decided, context, and rationale. Use plain paragraphs suitable for a decision block (2–4 sentences).'
    case 'ghost':
      return 'Complete the text naturally with at most one short sentence or phrase. Output only the completion — no quotes or explanation. Do not repeat text already written. If continuing after a word, start with a leading space.'
    default:
      return ''
  }
}

export function buildCompletionMessages(input: BuildMessagesInput) {
  const parts: string[] = []

  if (input.pageTitle) {
    parts.push(`Page title: ${input.pageTitle}`)
  }

  if (input.selection?.trim()) {
    parts.push(`Selected text:\n${input.selection.trim()}`)
  } else if (input.pageContext?.trim()) {
    parts.push(`Page content:\n${input.pageContext.trim()}`)
  }

  const templateLine = input.template ? templateInstruction(input.template) : ''
  const userPrompt = input.prompt.trim()

  const instruction = [templateLine, userPrompt].filter(Boolean).join('\n\n')

  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: parts.length > 0 ? `${parts.join('\n\n')}\n\n---\n\n${instruction}` : instruction,
    },
  ]
}

export const AI_COMPLETION_TEMPLATES = [
  'ask',
  'summarize',
  'improve',
  'continue',
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
  'action_items',
  'questions',
  'decision',
  'ghost',
] as const
