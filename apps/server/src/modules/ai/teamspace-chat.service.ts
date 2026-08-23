import { z } from 'zod'
import { formatAiWorkspaceContext, type AiWorkspaceContext } from './retrieval'

export const teamspaceChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
})

export const teamspaceChatRequestSchema = z.object({
  spaceId: z.string().min(1).max(64),
  prompt: z.string().min(1).max(4000),
  messages: z.array(teamspaceChatMessageSchema).max(20).optional(),
  model: z.string().min(1).max(120).optional(),
  contextRefs: z
    .array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('note'), id: z.string().min(1).max(64) }),
        z.object({
          type: z.literal('task'),
          id: z.string().min(1).max(64),
          boardId: z.string().min(1).max(64),
        }),
      ]),
    )
    .max(8)
    .optional(),
})

export type TeamspaceChatRequest = z.infer<typeof teamspaceChatRequestSchema>

const BASE_SYSTEM_PROMPT = `You are a helpful assistant inside a notes and projects workspace. Answer the user's question directly using the teamspace context — notes, tasks, members, and linked docs. Be concise and practical. Use markdown when it helps (lists, short headings). Do not invent facts that are not in the context. If something is missing, say so briefly.

When the user asks about one task or a narrow topic, answer in 2–4 sentences. Link the task or note once using markdown in the first sentence. Do not use labeled blocks like "Task:", "Status:", or "Details:". Do not add closing lines like "see the following link", "view details here", or "find more details" — sources appear separately in the UI.

When asked about launch blockers, what is blocking launch, or what remains to ship:
- Use the "Structured launch blockers" section first when present
- Lead with Must ship checklist items, then open launch sprint tasks
- Every checklist item and task MUST use the citation link format shown in structured blockers
- Do not say the context lacks details if structured blockers are present

When you reference a note or task from the context, link it using markdown exactly:
- Notes: [Title](note:PAGE_ID)
- Tasks: [Title](task:BOARD_ID/TASK_ID)
Only use IDs that appear in the context lines.`

function buildSystemPrompt(workspaceContext: AiWorkspaceContext) {
  return `${BASE_SYSTEM_PROMPT}

Teamspace context:
${formatAiWorkspaceContext(workspaceContext)}`
}

export function buildTeamspaceChatMessages(
  input: TeamspaceChatRequest,
  workspaceContext: AiWorkspaceContext,
) {
  const history = (input.messages ?? []).map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }))

  return [
    { role: 'system' as const, content: buildSystemPrompt(workspaceContext) },
    ...history,
    { role: 'user' as const, content: input.prompt.trim() },
  ]
}
