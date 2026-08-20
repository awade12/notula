import * as Y from 'yjs'

export function extractOpenCommentCount(state: Uint8Array) {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)

  const threadsMap = doc.getMap('threads')
  if (threadsMap.size === 0) return 0

  let count = 0

  threadsMap.forEach((threadValue) => {
    if (!(threadValue instanceof Y.Map)) return
    const resolved = threadValue.get('resolved')
    if (resolved !== true) {
      count += 1
    }
  })

  return count
}
