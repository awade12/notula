import { z } from 'zod'
import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import { formatAiWorkspaceContext, type AiWorkspaceContext } from './retrieval'
import { createChatCompletion } from './openrouter'

export const taskAiActionSchema = z.object({
  propertyId: z.string().min(1).max(64),
  value: z.unknown(),
  summary: z.string().min(1).max(200),
})

export const taskAiCreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(8000).optional(),
  status: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
})

export const taskAiResponseSchema = z.object({
  reply: z.string().min(1).max(8000),
  actions: z.array(taskAiActionSchema).max(12),
  createTasks: z.array(taskAiCreateTaskSchema).max(8).optional(),
})

export const taskAiPropertySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'select', 'multi_select']),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      }),
    )
    .optional(),
})

export const taskAiMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
})

export const taskAgentRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  spaceId: z.string().min(1).max(64).optional(),
  boardId: z.string().min(1).max(64).optional(),
  taskId: z.string().min(1).max(64).optional(),
  linkedPageId: z.string().min(1).max(64).optional(),
  taskTitle: z.string().max(500),
  taskContext: z.string().max(32000),
  properties: z.array(taskAiPropertySchema).min(1).max(30),
  members: z.array(taskAiMemberSchema).max(100).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(8000),
      }),
    )
    .max(20)
    .optional(),
  model: z.string().min(1).max(120).optional(),
})

export type TaskAgentRequest = z.infer<typeof taskAgentRequestSchema>
export type TaskAiResponse = z.infer<typeof taskAiResponseSchema>
export type TaskAiProperty = z.infer<typeof taskAiPropertySchema>

const BASE_SYSTEM_PROMPT = `You are the assistant for one open project task. The user is viewing this task right now — you already have its full snapshot below.

Respond with ONLY valid JSON (no markdown fences, no commentary outside JSON):
{
  "reply": "natural message to the user",
  "actions": [
    { "propertyId": "exact id from schema", "value": <typed value>, "summary": "short change label" }
  ],
  "createTasks": [
    {
      "title": "New subtask title",
      "description": "optional markdown",
      "status": "option id",
      "assigneeId": "member userId or null",
      "labelIds": ["option id"]
    }
  ]
}

Task awareness (critical):
- Never ask the user to paste task details, re-describe the task, or "provide more information" when the snapshot already has enough to act.
- You always see the current title, description, status, labels, dates, and assignee in the snapshot.
- Phrases like "make this more in depth", "flesh this out", "expand", "break down", "add detail", "improve the writeup" mean rewrite the description — return a description action with the full new markdown text.
- For greetings or vague openers, reply briefly in context of THIS task (use its title) and suggest one concrete next step you can take on it.
- Answer questions using the snapshot and teamspace context only — do not invent facts.

Property rules:
- propertyId must match an id from the editable property schema exactly.
- For select fields, value must be an option id from the schema (not the label).
- For multi_select (labels), value must be an array of option ids.
- For text fields (title, description, due_date, assignee), value is a string. Use YYYY-MM-DD for due_date.
- For assignee, value must be a member userId from the members list, or null to unassign.
- For number (estimate), value is a number or null.
- For description updates, put the complete new description in value (markdown lists and paragraphs are fine).
- Use proper markdown line breaks: blank line between headings and sections, each list item on its own line.
- If the user only asks a question with no change requested, return an empty actions array.
- When they ask you to update, fix, set, or change something, include the matching actions.
- When they ask to break work into subtasks, add follow-up tasks, or create tasks on this board, return createTasks with new rows to add. Do not use createTasks to edit the open task — use actions for that.
- createTasks titles must be specific. Use status/assignee/label ids from the schema when relevant.
- Keep reply conversational and specific to this task. Summaries should name the field and change (e.g. "Add launch todo checklist to description", "Set status to In progress").
- In reply, briefly say what you are proposing to change before the user applies it.

Example — user says "could we make this more indepth please" on task "Ship onboarding checklist" with a short description:
{
  "reply": "I'll expand the description with clearer scope, steps, and acceptance criteria based on what's already here.",
  "actions": [
    { "propertyId": "description", "value": "## Overview\\n...full markdown...", "summary": "Expand description" }
  ]
}`

function buildSystemPrompt(workspaceContext?: AiWorkspaceContext | null) {
  if (!workspaceContext) return BASE_SYSTEM_PROMPT

  return `${BASE_SYSTEM_PROMPT}

Teamspace context may include related notes, other tasks, linked doc content, and members. Use it when relevant. Link notes/tasks as [Title](note:PAGE_ID) or [Title](task:BOARD_ID/TASK_ID).`
}

function buildPropertySchemaBlock(properties: TaskAgentRequest['properties']) {
  return JSON.stringify(properties, null, 2)
}

function buildMembersBlock(members: TaskAgentRequest['members']) {
  if (!members?.length) return ''
  return `\nTeam members (for assignee):\n${JSON.stringify(members, null, 2)}`
}

export function buildTaskAgentMessages(
  input: TaskAgentRequest,
  workspaceContext?: AiWorkspaceContext | null,
) {
  const systemSections = [
    buildSystemPrompt(workspaceContext),
    '',
    '=== Current task snapshot (authoritative — do not ask user to repeat this) ===',
    input.taskContext.trim(),
    '',
    '=== Editable property schema ===',
    buildPropertySchemaBlock(input.properties),
    buildMembersBlock(input.members),
  ]

  if (workspaceContext) {
    systemSections.push('', '=== Teamspace context ===', formatAiWorkspaceContext(workspaceContext))
  }

  const history = (input.messages ?? []).map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }))

  return [
    { role: 'system' as const, content: systemSections.filter(Boolean).join('\n') },
    ...history,
    { role: 'user' as const, content: input.prompt.trim() },
  ]
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed

  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Task assistant returned invalid JSON')
  }

  return candidate.slice(start, end + 1)
}

export function parseTaskAgentResponse(raw: string): TaskAiResponse {
  const jsonText = extractJsonObject(raw)
  const parsed: unknown = JSON.parse(jsonText)
  return taskAiResponseSchema.parse(parsed)
}

function wantsDescriptionExpansion(prompt: string) {
  const lower = prompt.toLowerCase()
  return /\b(more in\s*-?\s*depth|in\s*depth|expand|flesh out|elaborate|more detail|add detail|break down|improve the (writeup|description)|detailed|go deeper)\b/.test(
    lower,
  )
}

function hasDescriptionAction(actions: TaskAiResponse['actions']) {
  return actions.some((action) => action.propertyId === PROJECT_BOARD_PROPERTY_IDS.description)
}

const TASK_AGENT_COMPLETION_OPTIONS = {
  responseFormat: 'json_object' as const,
  temperature: 0.3,
  maxTokens: 4096,
}

export async function runTaskAgent(
  apiKey: string,
  model: string,
  input: TaskAgentRequest,
  workspaceContext?: AiWorkspaceContext | null,
): Promise<TaskAiResponse> {
  const messages = buildTaskAgentMessages(input, workspaceContext)
  const raw = await createChatCompletion(apiKey, model, messages, TASK_AGENT_COMPLETION_OPTIONS)
  if (!raw.trim()) {
    throw new Error('Task assistant returned an empty response')
  }

  let result = parseTaskAgentResponse(raw)

  if (wantsDescriptionExpansion(input.prompt) && !hasDescriptionAction(result.actions)) {
    const retryRaw = await createChatCompletion(
      apiKey,
      model,
      [
        ...messages,
        { role: 'assistant', content: JSON.stringify(result) },
        {
          role: 'user',
          content:
            'Return JSON only. Include a description action with the full expanded markdown for this task. Use the task snapshot in the system message — do not ask the user to provide task details again.',
        },
      ],
      TASK_AGENT_COMPLETION_OPTIONS,
    )

    if (retryRaw.trim()) {
      result = parseTaskAgentResponse(retryRaw)
    }
  }

  return result
}
