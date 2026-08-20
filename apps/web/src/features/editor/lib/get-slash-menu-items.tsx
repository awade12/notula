import {
  filterSuggestionItems,
  getDefaultSlashMenuItems,
} from '@blocknote/core/extensions'
import { insertOrUpdateBlockForSlashMenu } from './insert-or-update-block-for-slash-menu'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import {
  CheckSquare,
  ChevronRight,
  Code2,
  Globe,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Info,
  List,
  ListOrdered,
  MessageSquareQuote,
  Radio,
  CheckCircle2,
  Minus,
  Table2,
  Text,
  Sparkles,
} from 'lucide-react'
import type { JSX } from 'react'
import type { AiCompletionTemplate } from '@/features/ai/types'
import { SLASH_AI_ACTIONS } from '@/features/ai/lib/prompt-templates'
import type { NotesEditor } from './block-schema'

const slashIcons: Record<string, JSX.Element> = {
  heading: <Heading1 size={18} strokeWidth={2} />,
  heading_2: <Heading2 size={18} strokeWidth={2} />,
  heading_3: <Heading3 size={18} strokeWidth={2} />,
  quote: <MessageSquareQuote size={18} strokeWidth={2} />,
  numbered_list: <ListOrdered size={18} strokeWidth={2} />,
  bullet_list: <List size={18} strokeWidth={2} />,
  check_list: <CheckSquare size={18} strokeWidth={2} />,
  toggle_list: <ChevronRight size={18} strokeWidth={2} />,
  paragraph: <Text size={18} strokeWidth={2} />,
  code_block: <Code2 size={18} strokeWidth={2} />,
  table: <Table2 size={18} strokeWidth={2} />,
  image: <Image size={18} strokeWidth={2} />,
  divider: <Minus size={18} strokeWidth={2} />,
  callout: <Info size={18} strokeWidth={2} />,
}

function getAiSlashItems(
  onRun: (template: AiCompletionTemplate) => void,
): DefaultReactSuggestionItem[] {
  return SLASH_AI_ACTIONS.map((action) => ({
    key: `ai-${action.id}`,
    title: action.title,
    subtext: action.subtext,
    group: 'AI',
    aliases: action.aliases,
    icon: <Sparkles size={18} strokeWidth={2} />,
    onItemClick: () => {
      onRun(action.id)
    },
  }))
}

function getCalloutSlashItem(editor: NotesEditor): DefaultReactSuggestionItem {
  return {
    title: 'Callout',
    subtext: 'Highlight important information',
    group: 'Basic blocks',
    aliases: ['callout', 'alert', 'note', 'info'],
    icon: slashIcons.callout,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'callout',
        props: { type: 'info' },
      })
    },
  }
}

function getToggleSlashItem(editor: NotesEditor): DefaultReactSuggestionItem {
  return {
    title: 'Toggle',
    subtext: 'Collapsible section',
    group: 'Basic blocks',
    aliases: ['toggle', 'collapse', 'accordion'],
    icon: slashIcons.toggle_list,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'toggleListItem',
      })
    },
  }
}

function getEmbedSlashItem(editor: NotesEditor): DefaultReactSuggestionItem {
  return {
    title: 'Embed',
    subtext: 'Embed a URL (YouTube, Vimeo, etc.)',
    group: 'Media',
    aliases: ['embed', 'iframe', 'youtube', 'vimeo'],
    icon: <Globe size={18} strokeWidth={2} />,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'embed',
        props: { url: '' },
      })
    },
  }
}

function getKnowledgeSlashItems(
  editor: NotesEditor,
): DefaultReactSuggestionItem[] {
  const recordItems = [
    {
      title: 'Decision',
      subtext: 'Record what was agreed and why',
      aliases: ['decision', 'decide', 'agreed'],
      icon: <CheckCircle2 size={18} strokeWidth={2} />,
      props: { kind: 'decision' as const, status: 'draft' as const },
    },
    {
      title: 'Signal',
      subtext: 'Capture evidence, feedback, or an observation',
      aliases: ['signal', 'evidence', 'feedback', 'observation'],
      icon: <Radio size={18} strokeWidth={2} />,
      props: { kind: 'signal' as const, status: 'observed' as const },
    },
  ]

  return recordItems.map((item) => ({
    key: `knowledge-${item.props.kind}`,
    title: item.title,
    subtext: item.subtext,
    group: 'Records',
    aliases: item.aliases,
    icon: item.icon,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'knowledge',
        props: item.props,
      })
    },
  }))
}

function getDatabaseViewSlashItem(editor: NotesEditor): DefaultReactSuggestionItem {
  return {
    title: 'Database view',
    subtext: 'Embed a database inline',
    group: 'Media',
    aliases: ['database', 'db', 'table view'],
    icon: <Table2 size={18} strokeWidth={2} />,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'databaseView',
        props: { databaseId: '' },
      })
    },
  }
}

export function getNotesSlashMenuItems(
  editor: NotesEditor,
  aiOptions?: {
    enabled: boolean
    onRun: (template: AiCompletionTemplate) => void
  },
): DefaultReactSuggestionItem[] {
  const defaultItems = getDefaultSlashMenuItems(editor)
    .filter((item) => item.key !== 'toggle_list')
    .map((item) => ({
      ...item,
      icon: slashIcons[item.key],
    }))

  const calloutItem = getCalloutSlashItem(editor)
  const toggleItem = getToggleSlashItem(editor)
  const embedItem = getEmbedSlashItem(editor)
  const knowledgeItems = getKnowledgeSlashItems(editor)
  const databaseViewItem = getDatabaseViewSlashItem(editor)
  const aiItems = aiOptions?.enabled ? getAiSlashItems(aiOptions.onRun) : []
  const quoteIndex = defaultItems.findIndex((item) => item.key === 'quote')
  const insertAt = quoteIndex >= 0 ? quoteIndex + 1 : defaultItems.length

  return [
    ...defaultItems.slice(0, insertAt),
    calloutItem,
    toggleItem,
    ...defaultItems.slice(insertAt),
    embedItem,
    databaseViewItem,
    ...aiItems,
    ...knowledgeItems,
  ]
}

export async function filterNotesSlashMenuItems(
  editor: NotesEditor,
  query: string,
  aiOptions?: {
    enabled: boolean
    onRun: (template: AiCompletionTemplate) => void
  },
): Promise<DefaultReactSuggestionItem[]> {
  return filterSuggestionItems(getNotesSlashMenuItems(editor, aiOptions), query)
}
