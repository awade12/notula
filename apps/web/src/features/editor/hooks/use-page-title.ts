import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import type { PageTreeNode } from '@/features/workspace/lib/build-tree'
import { updateTreeNodeTitle } from '@/features/workspace/lib/update-tree-title'
import { PAGE_TITLE_YKEY } from '../lib/page-title-key'

const TITLE_ORIGIN = 'notes-title-local'
const TITLE_DEBOUNCE_MS = 200

type UsePageTitleOptions = {
  doc: Y.Doc
  spaceId: string
  pageId: string
  initialTitle: string
  isDocReady: boolean
}

function writeTitleToDoc(doc: Y.Doc, value: string) {
  const yTitle = doc.getText(PAGE_TITLE_YKEY)
  const current = yTitle.toString()

  if (current === value) return

  doc.transact(() => {
    yTitle.delete(0, yTitle.length)
    if (value) {
      yTitle.insert(0, value)
    }
  }, TITLE_ORIGIN)
}

function resolveTitle(yTitle: Y.Text, initialTitle: string) {
  const fromDoc = yTitle.toString()
  if (fromDoc) return fromDoc

  const fallback = initialTitle.trim()
  if (fallback && fallback !== 'Untitled') return fallback

  return ''
}

export function usePageTitle({
  doc,
  spaceId,
  pageId,
  initialTitle,
  isDocReady,
}: UsePageTitleOptions) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const isFocusedRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const publishedTitleRef = useRef<string | null>(null)
  const initialTitleRef = useRef(initialTitle)

  initialTitleRef.current = initialTitle

  const syncToQueryCache = useCallback(
    (displayTitle: string) => {
      if (publishedTitleRef.current === displayTitle) return
      publishedTitleRef.current = displayTitle

      queryClient.setQueryData<PageTreeNode[] | undefined>(['pages', spaceId], (tree) => {
        if (!tree) return tree
        return updateTreeNodeTitle(tree, pageId, displayTitle)
      })

      queryClient.setQueryData<{ title: string } | undefined>(
        ['page', spaceId, pageId],
        (current) => {
          if (!current || current.title === displayTitle) return current
          return { ...current, title: displayTitle }
        },
      )
    },
    [pageId, queryClient, spaceId],
  )

  const applyTitle = useCallback(
    (nextTitle: string) => {
      setTitle((current) => (current === nextTitle ? current : nextTitle))
      syncToQueryCache(nextTitle.trim() || 'Untitled')
    },
    [syncToQueryCache],
  )

  useEffect(() => {
    isFocusedRef.current = false
    publishedTitleRef.current = null
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const fallback = initialTitleRef.current.trim()
    setTitle(fallback && fallback !== 'Untitled' ? fallback : '')
  }, [pageId, doc])

  useEffect(() => {
    if (!isDocReady) return

    const yTitle = doc.getText(PAGE_TITLE_YKEY)

    const syncFromDoc = (_event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.origin === TITLE_ORIGIN) return
      if (isFocusedRef.current) return
      applyTitle(resolveTitle(yTitle, initialTitleRef.current))
    }

    yTitle.observe(syncFromDoc)
    applyTitle(resolveTitle(yTitle, initialTitleRef.current))

    return () => {
      yTitle.unobserve(syncFromDoc)
    }
  }, [applyTitle, doc, isDocReady, pageId])

  const flushTitle = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      writeTitleToDoc(doc, value)
    },
    [doc],
  )

  const setPageTitle = useCallback(
    (value: string) => {
      setTitle(value)
      syncToQueryCache(value.trim() || 'Untitled')

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        flushTitle(value)
      }, TITLE_DEBOUNCE_MS)
    },
    [flushTitle, syncToQueryCache],
  )

  const onTitleFocus = useCallback(() => {
    isFocusedRef.current = true
  }, [])

  const onTitleBlur = useCallback(() => {
    isFocusedRef.current = false
    flushTitle(title)
  }, [flushTitle, title])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return { title, setPageTitle, onTitleFocus, onTitleBlur }
}
