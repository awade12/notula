import { z } from 'zod'
import { createChatCompletion } from './openrouter'
import { taskAiCreateTaskSchema, type TaskAiProperty } from './task-agent.service'

const specToTasksResponseSchema = z.object({
  tasks: z.array(taskAiCreateTaskSchema).max(12),
  summary: z.string().max(500).optional(),
})

export async function breakSpecIntoTasks(
  apiKey: string,
  model: string,
  input: {
    pageTitle: string
    pageContent: string
    boardTitle: string
    properties: TaskAiProperty[]
  },
) {
  const propertyLines = input.properties
    .map((property) => {
      const options =
        property.options?.map((option) => `${option.id} (${option.label})`).join(', ') ?? ''
      return `- ${property.id} (${property.type})${options ? `: ${options}` : ''}`
    })
    .join('\n')

  const system = `You break product specs into actionable project tasks. Return ONLY valid JSON:
{
  "summary": "one sentence overview",
  "tasks": [
    {
      "title": "specific task title",
      "description": "markdown details",
      "status": "option id if obvious",
      "assigneeIds": [],
      "labelIds": []
    }
  ]
}

Rules:
- Create 3-12 concrete tasks that cover the spec without duplicating work.
- Titles must be specific and shippable.
- Use property ids from the board schema for status/labels when clear.
- Do not invent assignees.`

  const user = `Board: ${input.boardTitle}

Editable properties:
${propertyLines}

Spec title: ${input.pageTitle}

Spec content:
${input.pageContent.slice(0, 12000)}`

  const raw = await createChatCompletion(apiKey, model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ])

  const parsed = specToTasksResponseSchema.parse(JSON.parse(raw))
  return parsed
}
