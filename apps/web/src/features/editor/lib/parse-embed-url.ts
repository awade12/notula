export type ParsedEmbed = {
  embedUrl: string
  title: string
}

export function parseEmbedUrl(url: string): ParsedEmbed | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      if (videoId) {
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          title: 'YouTube video',
        }
      }
    }

    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1).split('/')[0]
      if (videoId) {
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          title: 'YouTube video',
        }
      }
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const segments = parsed.pathname.split('/').filter(Boolean)
      const videoId = segments.at(-1)
      if (videoId) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          title: 'Vimeo video',
        }
      }
    }

    if (parsed.protocol === 'https:') {
      return {
        embedUrl: trimmed,
        title: 'Embedded content',
      }
    }
  } catch {
    return null
  }

  return null
}
