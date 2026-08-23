import { applyCitationLinks } from './apply-citation-links'
import type { AiWorkspaceCitation } from './teamspace-ask-page'
import { stripTrailingCitationDump } from './resolve-referenced-citations'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function citationHref(citation: AiWorkspaceCitation) {
  return citation.type === 'note'
    ? `note:${citation.id}`
    : `task:${citation.boardId}/${citation.id}`
}

function findCitationByTitle(citations: AiWorkspaceCitation[], title: string) {
  const normalized = title.trim().toLowerCase()
  return (
    citations.find((citation) => citation.title.toLowerCase() === normalized) ??
    citations.find((citation) => citation.title.toLowerCase().includes(normalized)) ??
    citations.find((citation) => normalized.includes(citation.title.toLowerCase()))
  )
}

function resolvePrimaryTask(citations: AiWorkspaceCitation[], content: string) {
  const tasks = citations.filter((citation) => citation.type === 'task')
  if (tasks.length === 0) return undefined
  if (tasks.length === 1) return tasks[0]

  return (
    tasks.find((task) => content.toLowerCase().includes(task.title.toLowerCase())) ?? tasks[0]
  )
}

function stripLinkBoilerplate(content: string) {
  return content
    .replace(/\n?Here are the details:\s*\n/i, '\n\n')
    .replace(
      /\s*You can find more details(?: on this task)?(?: in the following link)?(?::\s*[^.\n]+)?\.?\s*$/i,
      '',
    )
    .replace(/\s*You can (?:view|find|see) (?:the )?(?:task )?details here\.?\s*$/i, '')
    .replace(
      /\s*(?:See|Find|View) (?:more )?(?:the )?(?:task )?details(?: here)?\.?\s*$/i,
      '',
    )
    .replace(
      /\s*(?:See|Find) (?:more )?(?:details )?(?:on this task )?(?:at|in)?(?: the following link)?(?::\s*[^.\n]+)?\.?\s*$/i,
      '',
    )
    .replace(/\nThis task is (essential|critical|important)[^\n]+\.\s*/gi, '')
}

function linkOpeningTaskSentence(content: string, task: AiWorkspaceCitation) {
  const linkedTitle = `[${task.title}](${citationHref(task)})`
  const escapedTitle = escapeRegExp(task.title)

  return content
    .replace(/^The task to .+ is currently in progress\.\s*/i, `${linkedTitle} is in progress. `)
    .replace(/^The task for .+ is currently in progress\.\s*/i, `${linkedTitle} is in progress. `)
    .replace(
      new RegExp(`^${escapedTitle} is (?:currently )?in progress\\.\\s*`, 'i'),
      `${linkedTitle} is in progress. `,
    )
}

function ensureTaskLinked(content: string, task: AiWorkspaceCitation) {
  const href = citationHref(task)
  if (content.includes(`](${href})`)) return content

  const escapedTitle = escapeRegExp(task.title)
  return content.replace(new RegExp(`^${escapedTitle}\\b`, 'i'), `[${task.title}](${href})`)
}

function stripTrailingBareTitle(content: string, title: string) {
  return content.replace(new RegExp(`\\s*${escapeRegExp(title)}\\.?\\s*$`, 'i'), '')
}

export function polishAskAnswer(content: string, citations: AiWorkspaceCitation[]) {
  let result = stripTrailingCitationDump(content, citations)
  result = stripLinkBoilerplate(result)

  result = result.replace(
    /Task:\s*(.+?)\r?\nStatus:\s*\[?(\w+)\]?\r?\n(?:Details?:\s*)?(.+?)(?=\r?\n\r?\n|\r?\nThis |\s*$)/is,
    (_match, rawTitle: string, status: string, details: string) => {
      const citation = findCitationByTitle(citations, rawTitle)
      const linked = citation
        ? `[${citation.title}](${citationHref(citation)})`
        : rawTitle.trim()
      return `${linked} · ${status}\n\n${details.trim()}`
    },
  )

  const primaryTask = resolvePrimaryTask(citations, result)
  if (primaryTask) {
    result = linkOpeningTaskSentence(result, primaryTask)
  }

  result = applyCitationLinks(result, citations)

  if (primaryTask) {
    result = ensureTaskLinked(result, primaryTask)
    result = stripTrailingBareTitle(result, primaryTask.title)
  }

  return result.trim()
}
