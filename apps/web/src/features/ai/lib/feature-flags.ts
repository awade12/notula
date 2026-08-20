export type AiFeatureFlags = {
  turnInto: boolean
  continueWriting: boolean
  rewriteSelection: boolean
  slashCommands: boolean
  stalePageDetector: boolean
  meetingPrep: boolean
  duplicateDetection: boolean
  inlineGhostCompletion: boolean
}

export const DEFAULT_AI_FEATURE_FLAGS: AiFeatureFlags = {
  turnInto: true,
  continueWriting: true,
  rewriteSelection: true,
  slashCommands: true,
  stalePageDetector: true,
  meetingPrep: true,
  duplicateDetection: true,
  inlineGhostCompletion: false,
}

export function mergeAiFeatureFlags(partial: Partial<AiFeatureFlags> | undefined): AiFeatureFlags {
  return { ...DEFAULT_AI_FEATURE_FLAGS, ...partial }
}
