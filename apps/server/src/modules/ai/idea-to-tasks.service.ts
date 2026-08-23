import { z } from 'zod'
import { formatAiWorkspaceContext, type AiWorkspaceContext } from './retrieval'
import { createChatCompletion } from './openrouter'
import { taskAiCreateTaskSchema, type TaskAiProperty } from './task-agent.service'

const ideaChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
})

export const ideaToTasksResponseSchema = z.object({
  summary: z.string().max(800).optional(),
  tasks: z.array(taskAiCreateTaskSchema).max(20),
  reply: z.string().max(2000).optional(),
})

export type IdeaToTasksResult = z.infer<typeof ideaToTasksResponseSchema>
export type IdeaChatMessage = z.infer<typeof ideaChatMessageSchema>

const TASK_JSON_SHAPE = `{
  "summary": "2-3 sentences on how you interpreted or revised the plan",
  "reply": "Short friendly message to the user about what you changed",
  "tasks": [
    {
      "title": "Specific shippable task title",
      "description": "## Goal\\n...\\n\\n## Scope\\n...\\n\\n## Acceptance criteria\\n- ...\\n\\n## Dependencies\\n...",
      "status": "option id from schema",
      "labelIds": ["option id"],
      "milestone": "option id",
      "priority": "option id",
      "estimate": 3,
      "dueDate": "YYYY-MM-DD or omit",
      "assigneeIds": ["userId"]
    }
  ]
}`

function buildPropertySchemaBlock(properties: TaskAiProperty[]) {
  return properties
    .map((property) => {
      const options =
        property.options?.map((option) => `${option.id} (${option.label})`).join(', ') ?? ''
      return `- ${property.id} (${property.type})${options ? `: ${options}` : ''}`
    })
    .join('\n')
}

function buildMembersBlock(members: Array<{ userId: string; name: string }>) {
  if (members.length === 0) return ''
  return `\nTeam members (for assigneeIds):\n${JSON.stringify(members, null, 2)}`
}

function buildExistingTasksBlock(titles: string[]) {
  if (titles.length === 0) return ''
  return `\nExisting tasks on this board (avoid duplicating):\n${titles.map((title) => `- ${title}`).join('\n')}`
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned invalid JSON')
  }
  return candidate.slice(start, end + 1)
}

function buildSharedPlanningRules() {
  return `Property rules:
- Use status/label/milestone/priority option IDs from the schema exactly — never invent IDs.
- Titles must be specific and actionable — never "Task 1" or "Do the thing".
- Descriptions must be markdown with ## headings for Goal, Scope, Acceptance criteria, and Dependencies when relevant.
- Never prefix descriptions with "Markdown:" or cram **Goal**: labels into one inline paragraph.
- Use labelIds to group themes. Use milestone for release phases when configured.
- Use estimate as story points (1-13) when sizing is inferable.
- Only set assigneeIds when a team member is a clear owner; otherwise omit.
- Do not duplicate existing board tasks listed below.
- Return the full revised task list every time — not a diff.`
}

function buildInitialSystemPrompt() {
  return `You are a senior project planner. The user describes a product, game, feature, or initiative in plain language — often without task titles or structure. Turn that vision into a concrete task backlog.

Return ONLY valid JSON:
${TASK_JSON_SHAPE}

Initial planning rules:
- Infer the domain even when the user is vague.
- Default to 4-8 focused tasks unless the idea is tiny (1-2) or huge (up to 15).
- Order tasks logically (foundations before polish).
- If the idea spans multiple systems, separate tasks per system or phase.
- Do not ask clarifying questions — make reasonable assumptions and state them in summary.
- reply should briefly explain your grouping (e.g. "I split this into 6 tasks across contracts, economy, and UI.").

${buildSharedPlanningRules()}`
}

function buildRefinementSystemPrompt() {
  return `You are a senior project planner helping the user refine a draft task list before they add it to their board.

Return ONLY valid JSON:
${TASK_JSON_SHAPE}

Refinement rules:
- The user may ask for fewer tasks, one epic, more detail, renames, different grouping, etc. Follow their latest instruction precisely.
- Examples: "one big task" → merge into 1 comprehensive epic; "only 3 tasks" → exactly ~3 high-level items; "more granular" → 12+ smaller tasks.
- Keep the original idea's intent — refine structure, not randomly delete scope unless asked.
- Preserve good titles/descriptions where still valid; rewrite when merging or splitting.
- reply must acknowledge what you changed in plain language (1-2 sentences).

${buildSharedPlanningRules()}`
}

function buildContextBlock(input: {
  boardTitle: string
  properties: TaskAiProperty[]
  members?: Array<{ userId: string; name: string }>
  existingTaskTitles?: string[]
  workspaceContext?: AiWorkspaceContext | null
  idea: string
}) {
  const sections = [
    `Board: ${input.boardTitle}`,
    '',
    'Board property schema:',
    buildPropertySchemaBlock(input.properties),
    buildMembersBlock(input.members ?? []),
    buildExistingTasksBlock(input.existingTaskTitles ?? []),
    '',
    '=== Original idea ===',
    input.idea.trim().slice(0, 24000),
  ]

  if (input.workspaceContext) {
    sections.push('', '=== Teamspace context ===', formatAiWorkspaceContext(input.workspaceContext))
  }

  return sections.filter(Boolean).join('\n')
}

function buildCompletionMessages(input: {
  idea: string
  boardTitle: string
  properties: TaskAiProperty[]
  members?: Array<{ userId: string; name: string }>
  existingTaskTitles?: string[]
  workspaceContext?: AiWorkspaceContext | null
  messages?: IdeaChatMessage[]
  currentTasks?: z.infer<typeof taskAiCreateTaskSchema>[]
}) {
  const isRefinement = Boolean(input.currentTasks?.length || input.messages?.length)
  const contextBlock = buildContextBlock(input)

  if (!isRefinement) {
    return [
      { role: 'system' as const, content: buildInitialSystemPrompt() },
      { role: 'user' as const, content: contextBlock },
    ]
  }

  const draftBlock = input.currentTasks?.length
    ? `\n\n=== Current draft (${input.currentTasks.length} tasks) ===\n${JSON.stringify(input.currentTasks, null, 2)}`
    : ''

  const history = (input.messages ?? []).map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }))

  return [
    { role: 'system' as const, content: buildRefinementSystemPrompt() },
    {
      role: 'user' as const,
      content: `${contextBlock}${draftBlock}\n\nRevise the draft task list based on the conversation below.`,
    },
    ...history,
  ]
}

export async function breakIdeaIntoTasks(
  apiKey: string,
  model: string,
  input: {
    idea: string
    boardTitle: string
    properties: TaskAiProperty[]
    members?: Array<{ userId: string; name: string }>
    existingTaskTitles?: string[]
    workspaceContext?: AiWorkspaceContext | null
    messages?: IdeaChatMessage[]
    currentTasks?: z.infer<typeof taskAiCreateTaskSchema>[]
  },
): Promise<IdeaToTasksResult> {
  const messages = buildCompletionMessages(input)

  const raw = await createChatCompletion(apiKey, model, messages, {
    responseFormat: 'json_object',
    temperature: isRefinementRequest(input) ? 0.25 : 0.35,
    maxTokens: 8192,
  })

  if (!raw.trim()) {
    throw new Error('AI returned an empty response')
  }

  const parsed: unknown = JSON.parse(extractJsonObject(raw))
  return ideaToTasksResponseSchema.parse(parsed)
}

function isRefinementRequest(input: {
  messages?: IdeaChatMessage[]
  currentTasks?: z.infer<typeof taskAiCreateTaskSchema>[]
}) {
  return Boolean(input.currentTasks?.length || input.messages?.length)
}

export { ideaChatMessageSchema }
