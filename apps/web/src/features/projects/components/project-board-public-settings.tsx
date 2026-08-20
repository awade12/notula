import { useEffect, useMemo, useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { slugifyBoardPublicSlug } from '@notesapp/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/cn'

type ProjectBoardPublicSettingsProps = {
  spaceId: string
  boardId: string
  boardTitle: string
  isPublic: boolean
  publicSlug: string | null
  readOnly?: boolean
}

type PublicSettingsResponse = {
  settings: {
    isPublic: boolean
    publicSlug: string | null
  }
}

export function ProjectBoardPublicSettings({
  spaceId,
  boardId,
  boardTitle,
  isPublic,
  publicSlug,
  readOnly = false,
}: ProjectBoardPublicSettingsProps) {
  const queryClient = useQueryClient()
  const [draftSlug, setDraftSlug] = useState(publicSlug ?? slugifyBoardPublicSlug(boardTitle))
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setDraftSlug(publicSlug ?? slugifyBoardPublicSlug(boardTitle))
  }, [boardTitle, publicSlug])

  const updatePublic = useMutation({
    mutationFn: async (input: { isPublic?: boolean; publicSlug?: string | null }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases/${boardId}/public`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Could not update public settings')
      }
      return (await response.json()) as PublicSettingsResponse
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['database', spaceId, boardId] })
    },
  })

  const publicPath = useMemo(() => {
    const slug = draftSlug.trim()
    return slug ? `/p/${slug}` : '/p/…'
  }, [draftSlug])

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return publicPath
    return `${window.location.origin}${publicPath}`
  }, [publicPath])

  async function handleSaveSlug() {
    setError(null)
    try {
      await updatePublic.mutateAsync({ publicSlug: draftSlug.trim() })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save URL')
    }
  }

  async function handleTogglePublic(next: boolean) {
    setError(null)
    try {
      await updatePublic.mutateAsync({
        isPublic: next,
        publicSlug: draftSlug.trim() || slugifyBoardPublicSlug(boardTitle),
      })
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not update visibility')
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 bg-white/[0.02] p-3">
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-text-primary/40">
          Public URL
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-text-primary/45">/p/</span>
          <input
            value={draftSlug}
            disabled={readOnly || updatePublic.isPending}
            onChange={(event) => setDraftSlug(slugifyBoardPublicSlug(event.target.value))}
            className="min-w-0 flex-1 rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2 text-sm text-text-emphasis outline-none placeholder:text-text-primary/35 focus:border-white/20 disabled:opacity-40"
          />
          {!readOnly ? (
            <button
              type="button"
              disabled={updatePublic.isPending || !draftSlug.trim()}
              onClick={() => void handleSaveSlug()}
              className="shrink-0 rounded-lg border border-border/50 px-3 py-2 text-xs tracking-dashboard text-text-primary hover:bg-white/[0.04] disabled:opacity-40"
            >
              Save
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-white/[0.02] px-3 py-3">
        <div>
          <p className="text-sm text-text-emphasis">Public board</p>
          <p className="mt-0.5 text-[11px] text-text-primary/45">
            {isPublic ? 'Anyone with the link can view' : 'Only space members can view'}
          </p>
        </div>
        {!readOnly ? (
          <button
            type="button"
            disabled={updatePublic.isPending}
            onClick={() => void handleTogglePublic(!isPublic)}
            className={cn(
              'rounded-lg px-3 py-2 text-xs tracking-dashboard transition-colors',
              isPublic
                ? 'bg-white/10 text-text-emphasis hover:bg-white/14'
                : 'border border-border/50 text-text-primary hover:bg-white/[0.04]',
            )}
          >
            {updatePublic.isPending ? 'Saving…' : isPublic ? 'Unpublish' : 'Publish'}
          </button>
        ) : (
          <span className="text-xs text-text-primary/45">{isPublic ? 'Published' : 'Private'}</span>
        )}
      </div>

      {isPublic && draftSlug ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs tracking-dashboard text-text-primary hover:bg-white/[0.04]"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
            Open public board
          </a>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs tracking-dashboard text-text-primary hover:bg-white/[0.04]"
          >
            <Copy className="size-3.5" strokeWidth={1.75} />
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
