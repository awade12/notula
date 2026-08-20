import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
import { useParams } from '@tanstack/react-router'
import { useEffect, useId, useState } from 'react'
import { useInsightOptions } from '@/features/insights/hooks/use-insights'
import type { InsightOptions } from '@/features/insights/types'
import { resolveKnowledgeKindConfig } from './knowledge-kind-config'
import { KnowledgeOwnerMenu } from './knowledge-owner-menu'
import { KnowledgeStatusMenu } from './knowledge-status-menu'

export const knowledgeBlockSpec = createReactBlockSpec(
  {
    type: 'knowledge',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      kind: {
        default: 'decision',
        values: ['decision', 'signal', 'question', 'commitment'],
      },
      status: {
        default: 'draft',
        values: [
          'draft',
          'accepted',
          'superseded',
          'open',
          'resolved',
          'observed',
          'dismissed',
        ],
      },
      owner: { default: '' },
      source: { default: '' },
      supersedes: { default: '' },
      dueDate: { default: '' },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const kind = props.block.props.kind
      const config = resolveKnowledgeKindConfig(kind)
      const Icon = config.icon
      const params = useParams({ strict: false })
      const spaceId = 'spaceId' in params ? params.spaceId : undefined
      const { data: options } = useInsightOptions(spaceId)
      const members = options?.members ?? []

      function updateMetadata(
        changes: Partial<
          Pick<
            typeof props.block.props,
            'status' | 'owner' | 'source' | 'supersedes' | 'dueDate'
          >
        >,
      ) {
        props.editor.updateBlock(props.block, {
          type: 'knowledge',
          props: changes,
        })
      }

      return (
        <div
          className="notes-record"
          data-knowledge-kind={kind}
          data-status={props.block.props.status}
        >
          <div className="notes-record-rail" aria-hidden />
          <div className="notes-record-body">
            <div className="notes-record-content" ref={props.contentRef} />
            <div className="notes-record-tracker" contentEditable={false}>
              <span className="notes-record-tracker-label">Record</span>
              <span className="notes-record-tracker-sep" aria-hidden>
                ·
              </span>
              <span className="notes-record-tracker-kind">
                <Icon size={11} strokeWidth={1.75} aria-hidden />
                {config.shortLabel}
              </span>
              <span className="notes-record-tracker-sep" aria-hidden>
                ·
              </span>
              <KnowledgeStatusMenu
                value={props.block.props.status}
                statuses={config.statuses}
                ariaLabel={`${config.label} status`}
                onChange={(status) =>
                  updateMetadata({
                    status: status as typeof props.block.props.status,
                  })
                }
              />
              <span className="notes-record-tracker-sep" aria-hidden>
                ·
              </span>
              <KnowledgeOwnerMenu
                owner={props.block.props.owner}
                members={members}
                onChange={(owner) => updateMetadata({ owner })}
              />
              <label className="notes-record-meta-input">
                <span className="notes-record-meta-prefix">Source</span>
                <input
                  value={props.block.props.source}
                  onChange={(event) =>
                    updateMetadata({ source: event.target.value })
                  }
                  placeholder="Optional reference"
                  aria-label="Source or reference"
                />
              </label>
              {kind === 'decision' ? (
                <label className="notes-record-meta-input notes-record-meta-input-wide">
                  <span className="notes-record-meta-prefix">Supersedes</span>
                  <DecisionPicker
                    value={props.block.props.supersedes}
                    currentDecisionId={props.block.id}
                    decisions={options?.decisions ?? []}
                    onChange={(supersedes) => updateMetadata({ supersedes })}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>
      )
    },
  },
)

function getDecisionLabel(
  decision: InsightOptions['decisions'][number] | undefined,
) {
  if (!decision) return ''
  return `${decision.content || 'Untitled decision'} — ${decision.pageTitle}`
}

function DecisionPicker({
  value,
  currentDecisionId,
  decisions,
  onChange,
}: {
  value: string
  currentDecisionId: string
  decisions: InsightOptions['decisions']
  onChange: (value: string) => void
}) {
  const listId = useId()
  const available = decisions.filter(
    (decision) => decision.id !== currentDecisionId,
  )
  const selectedLabel = getDecisionLabel(
    decisions.find((decision) => decision.id === value),
  )
  const [query, setQuery] = useState(selectedLabel || value)

  useEffect(() => {
    setQuery(selectedLabel || value)
  }, [selectedLabel, value])

  function updateQuery(next: string) {
    setQuery(next)
    if (!next) {
      onChange('')
      return
    }
    const match = available.find(
      (decision) =>
        getDecisionLabel(decision).toLowerCase() === next.toLowerCase(),
    )
    if (match) onChange(match.id)
  }

  return (
    <>
      <input
        list={listId}
        value={query}
        onChange={(event) => updateQuery(event.target.value)}
        onBlur={() => setQuery(selectedLabel || '')}
        placeholder="Search decisions"
        aria-label="Superseded decision"
      />
      <datalist id={listId}>
        {available.map((decision) => (
          <option key={decision.id} value={getDecisionLabel(decision)} />
        ))}
      </datalist>
    </>
  )
}
