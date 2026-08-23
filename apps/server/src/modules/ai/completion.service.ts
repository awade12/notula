import { formatAiWorkspaceContext, type AiWorkspaceContext } from './retrieval'

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

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type BuildMessagesInput = {
  prompt: string
  pageTitle?: string
  pageContext?: string
  selection?: string
  template?: AiCompletionTemplate
  workspaceContext?: AiWorkspaceContext | null
  messages?: ChatMessage[]
}

const BASE_SYSTEM_PROMPT = `You are a writing assistant inside a notes app. Be concise and useful. Use markdown when it helps (headings, lists, checkboxes). Do not wrap the whole answer in a code fence.`

const REWRITE_OUTPUT_RULE = `Output ONLY the rewritten markdown content. No preamble, explanation, summary of changes, or duplicate second version. Start directly with the content (usually a heading).`

const REWRITE_TEMPLATES = new Set<AiCompletionTemplate>([
  'improve',
  'shorten',
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

function isRewriteRequest(input: BuildMessagesInput) {
  if (input.selection?.trim()) return true
  if (input.template && REWRITE_TEMPLATES.has(input.template)) return true
  if (REWRITE_PROMPT.test(input.prompt.trim())) return true
  return false
}

function buildSystemPrompt(workspaceContext?: AiWorkspaceContext | null) {
  if (!workspaceContext) return BASE_SYSTEM_PROMPT

  return `${BASE_SYSTEM_PROMPT}

You also receive teamspace context: the teamspace name, members, and retrieved notes or project tasks from the same teamspace. Use that context when it helps answer the user, but do not invent facts that are not in the provided context or the current page.

When you reference a note or task from the teamspace context, link it using markdown exactly:
- Notes: [Title](note:PAGE_ID)
- Tasks: [Title](task:BOARD_ID/TASK_ID)
Only use IDs that appear in the context.`
}

function buildPageContextBlock(input: BuildMessagesInput) {
  const parts: string[] = []

  if (input.pageTitle) {
    parts.push(`Page title: ${input.pageTitle}`)
  }

  if (input.selection?.trim()) {
    parts.push(`Selected text:\n${input.selection.trim()}`)
  } else if (input.pageContext?.trim()) {
    parts.push(`Page content:\n${input.pageContext.trim()}`)
  }

  return parts.join('\n\n')
}

function templateInstruction(template: AiCompletionTemplate) {
  switch (template) {
    case 'summarize':
      return 'Summarize the page content clearly in a few short paragraphs or bullet points.'
    case 'improve':
      return `Improve the writing for clarity and flow. Preserve meaning and tone. ${REWRITE_OUTPUT_RULE}`
    case 'continue':
      return 'Continue writing naturally from where the page or selection leaves off. Match voice and structure. Output only the new continuation — no preamble.'
    case 'shorten':
      return `Make the content shorter while keeping the key points. ${REWRITE_OUTPUT_RULE}`
    case 'explain':
      return 'Explain the content in plain language for someone new to the topic.'
    case 'formal':
      return `Rewrite in a more formal, professional tone. Keep the same meaning. ${REWRITE_OUTPUT_RULE}`
    case 'exec':
      return `Rewrite for executives: lead with outcome, minimize jargon, keep it scannable with short paragraphs or bullets. ${REWRITE_OUTPUT_RULE}`
    case 'engineer':
      return `Rewrite for engineers: be precise, include technical detail where relevant, use clear structure (bullets, code terms where appropriate). ${REWRITE_OUTPUT_RULE}`
    case 'grammar':
      return `Fix grammar, spelling, and punctuation. Preserve meaning and tone; change as little as possible beyond corrections. ${REWRITE_OUTPUT_RULE}`
    case 'expand_bullets':
      return `Expand bullet points into clear prose paragraphs. One paragraph per major bullet where sensible. ${REWRITE_OUTPUT_RULE}`
    case 'clearer':
      return `Rewrite to be shorter and clearer. Remove filler and redundancy. ${REWRITE_OUTPUT_RULE}`
    case 'turn_todos':
      return `Restructure this content as an actionable todo list. Use markdown checkboxes (- [ ] item). Group under ## headings if helpful. Extract concrete tasks only. ${REWRITE_OUTPUT_RULE}`
    case 'turn_meeting_notes':
      return `Restructure as meeting notes with ## Attendees (if inferable), ## Agenda, ## Discussion, ## Action items (checkboxes), ## Decisions. Use markdown headings and lists. ${REWRITE_OUTPUT_RULE}`
    case 'turn_prd':
      return `Restructure as a PRD outline: ## Problem, ## Goals, ## Non-goals, ## Users, ## Requirements, ## Success metrics, ## Open questions. Use bullets under each heading. ${REWRITE_OUTPUT_RULE}`
    case 'turn_retro':
      return `Restructure as a retrospective: ## What went well, ## What didn't, ## Action items (checkboxes). Be specific to the content provided. ${REWRITE_OUTPUT_RULE}`
    case 'turn_user_story_map':
      return `Restructure as a user story map: ## Backbone (user activities as ## headings), under each add ### Stories as bullet user stories ("As a… I want… so that…"). ${REWRITE_OUTPUT_RULE}`
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
  const workspaceBlock = input.workspaceContext
    ? `Teamspace context:\n${formatAiWorkspaceContext(input.workspaceContext)}`
    : ''
  const pageContextBlock = buildPageContextBlock(input)

  const templateLine = input.template ? templateInstruction(input.template) : ''
  const userPrompt = input.prompt.trim()
  const rewriteRule =
    isRewriteRequest(input) && (input.pageContext?.trim() || input.selection?.trim())
      ? REWRITE_OUTPUT_RULE
      : ''

  const currentUserContent = [templateLine, rewriteRule, userPrompt].filter(Boolean).join('\n\n')

  const history = (input.messages ?? []).map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }))

  const systemContent = [buildSystemPrompt(input.workspaceContext), workspaceBlock, pageContextBlock]
    .filter(Boolean)
    .join('\n\n')

  return [
    { role: 'system' as const, content: systemContent },
    ...history,
    { role: 'user' as const, content: currentUserContent },
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
