const STOP_WORDS = new Set([
  'about',
  'all',
  'any',
  'are',
  'ask',
  'can',
  'could',
  'does',
  'for',
  'from',
  'has',
  'have',
  'how',
  'our',
  'that',
  'the',
  'this',
  'was',
  'what',
  'whats',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'you',
  'your',
])

export function extractRetrievalTerms(query: string) {
  const normalized = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const rawTerms = normalized
    .split(' ')
    .map((term) => term.replace(/^'+|'+$/g, ''))
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term))

  const expanded: string[] = []
  for (const term of rawTerms) {
    expanded.push(term)
    if (term.endsWith('ing') && term.length > 5) {
      expanded.push(term.slice(0, -3))
    }
    if (term.endsWith('ers') && term.length > 5) {
      expanded.push(term.slice(0, -3))
    }
  }

  return [...new Set(expanded)]
}

export function buildKeywordRetrievalQuery(query: string) {
  const terms = extractRetrievalTerms(query)
  if (terms.length === 0) return query.trim()
  return terms.join(' ')
}

export function isLaunchBlockerQuery(query: string) {
  const lower = query.toLowerCase()
  return (
    /\bblock(ing|er|ers)?\b/.test(lower) ||
    /\blaunch\b/.test(lower) ||
    /\bship(ping|ped)?\b/.test(lower) ||
    /\bgating\b/.test(lower) ||
    /\bremaining\b/.test(lower) ||
    /\bleft to\b/.test(lower)
  )
}
