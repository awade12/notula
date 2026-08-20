import { z } from 'zod'
import { createChatCompletion } from './openrouter'

export const taskAiActionSchema = z.object({
  propertyId: z.string().min(1).max(64),
  value: z.unknown(),
  summary: z.string().min(1).max(200),
})

export const taskAiResponseSchema = z.object({
  reply: z.string().min(1).max(8000),
  actions: z.array(taskAiActionSchema).max(12),
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

const SYSTEM_PROMPT = `You are a task assistant in a project management app. You can read task fields and propose updates to them.

Respond with ONLY valid JSON (no markdown fences, no commentary outside JSON):
{
  "reply": "brief message to the user explaining what you did or answering their question",
  "actions": [
    { "propertyId": "exact id from schema", "value": <typed value>, "summary": "short human-readable change label" }
  ]
}

Rules:
- propertyId must match an id from the editable property schema exactly.
- For select fields, value must be an option id from the schema (not the label).
- For multi_select (labels), value must be an array of option ids.
- For text fields (title, description, due_date, assignee), value is a string. Use YYYY-MM-DD for due_date.
- For assignee, value must be a member userId from the members list, or null to unassign.
- For number (estimate), value is a number or null.
- For description rewrites, put the full new description text in value (markdown lists and paragraphs are fine).
- If the user only asks a question or wants suggestions without changing the task, return an empty actions array.
- When the user asks you to update, fix, set, or change something, include the matching actions.
- Keep reply concise. summaries should be short labels like "Set status to In progress".`

function buildPropertySchemaBlock(properties: TaskAgentRequest['properties']) {
  return JSON.stringify(properties, null, 2)
}

function buildMembersBlock(members: TaskAgentRequest['members']) {
  if (!members?.length) return ''
  return `\n\nTeam members (for assignee):\n${JSON.stringify(members, null, 2)}`
}

export function buildTaskAgentMessages(input: TaskAgentRequest) {
  const contextBlock = [
    `Task title: ${input.taskTitle}`,
    `Current task:\n${input.taskContext.trim()}`,
    `\nEditable properties schema:\n${buildPropertySchemaBlock(input.properties)}`,
    buildMembersBlock(input.members),
  ]
    .filter(Boolean)
    .join('\n')

  const history = (input.messages ?? []).map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }))

  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: contextBlock },
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

export async function runTaskAgent(
  apiKey: string,
  model: string,
  input: TaskAgentRequest,
): Promise<TaskAiResponse> {
  const messages = buildTaskAgentMessages(input)
  const raw = await createChatCompletion(apiKey, model, messages)
  if (!raw.trim()) {
    throw new Error('Task assistant returned an empty response')
  }
  return parseTaskAgentResponse(raw)
}
