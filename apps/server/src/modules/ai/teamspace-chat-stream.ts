import type { AiWorkspaceCitation } from './retrieval'

export function prependWorkspaceMetaToStream(
  upstream: ReadableStream<Uint8Array>,
  citations: AiWorkspaceCitation[],
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const preamble = encoder.encode(
    `data: ${JSON.stringify({ notesapp: { citations } })}\n\n`,
  )

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(preamble)

      const reader = upstream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
  })
}
