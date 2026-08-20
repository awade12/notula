import { Menu } from '@mantine/core'
import { ChevronDown } from 'lucide-react'

export function KnowledgeStatusMenu({
  value,
  statuses,
  onChange,
  ariaLabel,
}: {
  value: string
  statuses: ReadonlyArray<{ value: string; label: string }>
  onChange: (value: string) => void
  ariaLabel: string
}) {
  const current =
    statuses.find((status) => status.value === value)?.label ?? value

  return (
    <Menu withinPortal={false} position="bottom-end" offset={4}>
      <Menu.Target>
        <button
          type="button"
          className="notes-knowledge-menu-trigger"
          aria-label={ariaLabel}
        >
          {current}
          <ChevronDown size={11} strokeWidth={2} aria-hidden />
        </button>
      </Menu.Target>
      <Menu.Dropdown className="notes-knowledge-menu">
        {statuses.map((status) => (
          <Menu.Item
            key={status.value}
            onClick={() => onChange(status.value)}
            className={
              status.value === value ? 'notes-knowledge-menu-item-active' : undefined
            }
          >
            {status.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
