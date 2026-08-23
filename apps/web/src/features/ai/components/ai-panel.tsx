import { Sparkles, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { usePageAiChat } from '../hooks/use-page-ai-chat'
import type { AiCompletionTemplate } from '../types'
import type { PageAiContextRef } from '../types/page-ai'
import { AiMissingKeyNotice } from './ai-model-picker'
import { PageAiComposer } from './page-ai-composer'
import { PageAiContextPicker } from './page-ai-context-picker'
import { PageAiMessages } from './page-ai-messages'
import { PageAiPanelToolbar } from './page-ai-panel-toolbar'
import { PageAiThreadList } from './page-ai-thread-list'
import { PageSpecToTasksDialog } from './page-spec-to-tasks-dialog'

type AiPanelProps = {
  editor: NotesEditor
  pageTitle: string
  spaceId: string
  pageId: string
  onClose: () => void
}

export function AiPanel({ editor, pageTitle, spaceId, pageId, onClose }: AiPanelProps) {
  const { data: settings, isLoading } = useAiSettings()
  const {
    messages,
    threads,
    activeThreadId,
    isStreaming,
    error,
    sendMessage,
    stop,
    startNewThread,
    selectThread,
    deleteThread,
    deleteActiveThread,
  } = usePageAiChat(pageId, spaceId)
  const [draft, setDraft] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [contextRefs, setContextRefs] = useState<PageAiContextRef[]>([])
  const [specDialogOpen, setSpecDialogOpen] = useState(false)

  const pageContext = editor.blocksToMarkdownLossy(editor.document).slice(0, 12000)

  useEffect(() => {
    setDraft('')
    setShowHistory(false)
    setContextRefs([])
  }, [pageId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSend(text?: string, template?: AiCompletionTemplate) {
    const trimmed = (text ?? draft).trim()
    if (!trimmed || isStreaming || !settings?.hasApiKey) return

    setDraft('')
    setShowHistory(false)
    const selection = editor.getSelectedText().trim()

    await sendMessage({
      prompt: trimmed,
      spaceId,
      pageId,
      pageTitle,
      pageContext: selection ? undefined : pageContext,
      selection: selection || undefined,
      template,
      model: settings.defaultModel,
      contextRefs,
    })
  }

  function handleNewConversation() {
    startNewThread()
    setShowHistory(false)
    setDraft('')
  }

  function handleSelectThread(threadId: string) {
    selectThread(threadId)
    setShowHistory(false)
    setDraft('')
  }

  if (isLoading) {
    return (
      <AiPanelFrame onClose={onClose}>
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-text-primary/50">
          Loading…
        </div>
      </AiPanelFrame>
    )
  }

  if (!settings?.hasApiKey) {
    return (
      <AiPanelFrame onClose={onClose}>
        <div className="flex-1 overflow-y-auto p-4">
          <AiMissingKeyNotice />
        </div>
      </AiPanelFrame>
    )
  }

  const showSuggestions = messages.length === 0 && !isStreaming && !showHistory
  const activeThread = threads.find((thread) => thread.id === activeThreadId)
  const canDeleteActive = Boolean(activeThread && activeThread.messages.length > 0)

  return (
    <AiPanelFrame
      onClose={onClose}
      toolbar={
        <PageAiPanelToolbar
          showHistory={showHistory}
          canDeleteActive={canDeleteActive}
          onNewConversation={handleNewConversation}
          onToggleHistory={() => setShowHistory((open) => !open)}
          onDeleteActive={deleteActiveThread}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showHistory ? (
          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <div className="px-3 pb-2 pt-1">
              <p className="text-[13px] font-medium text-text-emphasis">Past conversations</p>
              <p className="mt-1 text-[12px] text-text-primary/40">
                Conversations sync to your account for this page.
              </p>
            </div>
            <PageAiThreadList
              threads={threads}
              activeThreadId={activeThreadId}
              onSelect={handleSelectThread}
              onDelete={deleteThread}
            />
          </div>
        ) : (
          <PageAiMessages
            spaceId={spaceId}
            pageTitle={pageTitle}
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            editor={editor}
            onClose={onClose}
          />
        )}

        {!showHistory ? (
          <>
            <div className="shrink-0 px-4 pt-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <PageAiContextPicker
                  spaceId={spaceId}
                  contextRefs={contextRefs}
                  disabled={isStreaming}
                  onChange={setContextRefs}
                />
                <button
                  type="button"
                  onClick={() => setSpecDialogOpen(true)}
                  className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-text-primary/55 hover:bg-sidebar hover:text-text-primary/75"
                >
                  Break into tasks
                </button>
              </div>
            </div>
            <PageAiComposer
            draft={draft}
            isStreaming={isStreaming}
            showSuggestions={showSuggestions}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            onQuickAction={(prompt, template) => void handleSend(prompt, template)}
            onStop={stop}
          />
          </>
        ) : null}
      </div>
      <PageSpecToTasksDialog
        spaceId={spaceId}
        pageId={pageId}
        pageTitle={pageTitle}
        open={specDialogOpen}
        onOpenChange={setSpecDialogOpen}
      />
    </AiPanelFrame>
  )
}

function AiPanelFrame({
  onClose,
  toolbar,
  children,
}: {
  onClose: () => void
  toolbar?: ReactNode
  children: ReactNode
}) {
  return (
    <aside className="notes-ai-panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border py-3 pl-4 pr-14">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sparkles size={16} strokeWidth={1.75} className="shrink-0 text-text-primary/60" aria-hidden />
          <h2 className="truncate text-sm font-medium tracking-dashboard text-text-emphasis">AI</h2>
          {toolbar ? <div className="ml-1 flex shrink-0 items-center">{toolbar}</div> : null}
        </div>
        <button
          type="button"
          aria-label="Close AI panel"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-primary/50 transition-colors hover:bg-white/[0.05] hover:text-text-primary"
        >
          <X size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {children}
    </aside>
  )
}
