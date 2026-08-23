import { z } from 'zod'

export const aiFeatureFlagsSchema = z.object({
  turnInto: z.boolean(),
  continueWriting: z.boolean(),
  rewriteSelection: z.boolean(),
  slashCommands: z.boolean(),
  stalePageDetector: z.boolean(),
  meetingPrep: z.boolean(),
  duplicateDetection: z.boolean(),
  inlineGhostCompletion: z.boolean(),
  teamspaceAsk: z.boolean(),
})

export type AiFeatureFlags = z.infer<typeof aiFeatureFlagsSchema>

export const DEFAULT_AI_FEATURE_FLAGS: AiFeatureFlags = {
  turnInto: true,
  continueWriting: true,
  rewriteSelection: true,
  slashCommands: true,
  stalePageDetector: true,
  meetingPrep: true,
  duplicateDetection: true,
  inlineGhostCompletion: false,
  teamspaceAsk: true,
}

export function parseAiFeatureFlags(value: unknown): AiFeatureFlags {
  const parsed = aiFeatureFlagsSchema.safeParse(value)
  if (parsed.success) return parsed.data
  return { ...DEFAULT_AI_FEATURE_FLAGS }
}

export function mergeAiFeatureFlags(partial: Partial<AiFeatureFlags> | undefined): AiFeatureFlags {
  return { ...DEFAULT_AI_FEATURE_FLAGS, ...partial }
}
