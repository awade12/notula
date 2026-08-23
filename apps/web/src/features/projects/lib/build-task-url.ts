export function buildProjectTaskUrl(spaceId: string, boardId: string, taskId: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/s/${spaceId}/projects/${boardId}?task=${encodeURIComponent(taskId)}`
}
