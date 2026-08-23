import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { filterRuleSchema } from '@notesapp/shared'
import { createChatCompletion } from './openrouter'
import type { TaskAiProperty } from './task-agent.service'

const boardFilterResponseSchema = z.object({
  filters: z.array(
    z.object({
      propertyId: z.string(),
      operator: filterRuleSchema.shape.operator,
      value: z.unknown().optional(),
    }),
  ),
})

const SYSTEM_PROMPT = `You convert natural language into database filter rules for a project board.

Return ONLY valid JSON:
{
  "filters": [
    { "propertyId": "exact id from schema", "operator": "is|is_not|is_empty|is_not_empty|contains", "value": <typed value or omit> }
  ]
}

Rules:
- propertyId must match the schema exactly.
- For select fields, value must be an option id from the schema.
- For multi_select (labels), use operator "contains" with a single option id, or multiple filter rows.
- For assignee, value is a member userId string.
- For due_date, value is YYYY-MM-DD when comparing dates; use operator "contains" only for text fields.
- For text title/description, use "contains" for substring search.
- Prefer practical filters the user asked for. Return an empty filters array if the request is unclear.
- Do not invent property ids or option ids not in the schema.`

export async function parseBoardFilterFromPrompt(
  apiKey: string,
  model: string,
  prompt: string,
  properties: TaskAiProperty[],
) {
  const raw = await createChatCompletion(
    apiKey,
    model,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          prompt: prompt.trim(),
          properties,
        }),
      },
    ],
    {
      responseFormat: 'json_object',
      temperature: 0.1,
      maxTokens: 1024,
    },
  )

  if (!raw.trim()) {
    throw new Error('Could not parse filters')
  }

  const parsed = boardFilterResponseSchema.parse(JSON.parse(raw.trim()))

  return parsed.filters.map((filter) =>
    filterRuleSchema.parse({
      id: randomUUID(),
      propertyId: filter.propertyId,
      operator: filter.operator,
      value: filter.value,
    }),
  )
}
