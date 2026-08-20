import { Outlet } from '@tanstack/react-router'
import {
  Keyboard,
  Link2,
  Lock,
  Monitor,
  Palette,
  Search,
  Shield,
  Sparkles,
  Type,
  UserRound,
  Users,
} from 'lucide-react'
import { SettingsNav, type SettingsNavItem } from '@/features/settings/components/settings-nav'

const settingsNavItems: SettingsNavItem[] = [
  {
    to: '/settings/profile',
    label: 'Profile',
    description: 'Name and account details',
    icon: UserRound,
  },
  {
    to: '/settings/security',
    label: 'Security',
    description: 'Password and sessions',
    icon: Lock,
  },
  {
    to: '/settings/appearance',
    label: 'Appearance',
    description: 'Theme, fonts, and accent',
    icon: Palette,
  },
  {
    to: '/settings/editor',
    label: 'Editor',
    description: 'Typography and layout',
    icon: Type,
  },
  {
    to: '/settings/interface',
    label: 'Interface',
    description: 'Sidebar and behavior',
    icon: Monitor,
  },
  {
    to: '/settings/ai',
    label: 'AI',
    description: 'OpenRouter and models',
    icon: Sparkles,
  },
  {
    to: '/settings/search',
    label: 'Search',
    description: 'Hybrid and semantic',
    icon: Search,
  },
  {
    to: '/settings/shortcuts',
    label: 'Shortcuts',
    description: 'Keyboard bindings',
    icon: Keyboard,
  },
  {
    to: '/settings/collaboration',
    label: 'Collaboration',
    description: 'Cursors and presence',
    icon: Users,
  },
  {
    to: '/settings/links',
    label: 'Links',
    description: 'Backlinks and mentions',
    icon: Link2,
  },
  {
    to: '/settings/privacy',
    label: 'Privacy & data',
    description: 'Cache and sidebar defaults',
    icon: Shield,
  },
]

export function SettingsShell() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center py-6 lg:py-10">
      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-8 lg:gap-10">
        <header className="shrink-0 text-center lg:text-left">
          <p className="text-meta tracking-dashboard text-text-primary">Workspace</p>
          <h1 className="mt-1 text-2xl font-medium tracking-dashboard text-text-emphasis">
            Settings
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm tracking-dashboard text-text-primary lg:mx-0">
            Account, AI, search, collaboration, appearance, and local data preferences.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <SettingsNav items={settingsNavItems} />
          <div className="scrollbar-none min-h-0 min-w-0 overflow-y-auto pr-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
