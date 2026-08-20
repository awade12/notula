import { iconExists } from '@hugeicons/core-free-icons/loader'
import { iconNameToLabel, iconNameToSlug, isPageIconSlug, slugToIconName } from '@/features/workspace/lib/page-icon-slug'

export type PageIconDefinition = {
  id: string
  iconName: string
  label: string
}

const FEATURED_ICON_NAMES = [
  'NoteEditIcon',
  'Notebook01Icon',
  'StickyNote01Icon',
  'File02Icon',
  'FileAddIcon',
  'Folder03Icon',
  'FolderOpenIcon',
  'FolderAddIcon',
  'ArchiveIcon',
  'InboxIcon',
  'Pin02Icon',
  'Bookmark01Icon',
  'Tag01Icon',
  'Flag01Icon',
  'StarCircleIcon',
  'FavouriteIcon',
  'Idea01Icon',
  'LightbulbOffIcon',
  'Brain01Icon',
  'SparklesIcon',
  'AiMagicIcon',
  'Target01Icon',
  'Tick02Icon',
  'Task01Icon',
  'CheckListIcon',
  'Calendar01Icon',
  'Clock01Icon',
  'AlarmClockIcon',
  'Timer01Icon',
  'Rocket01Icon',
  'FireIcon',
  'Bolt01Icon',
  'Activity01Icon',
  'ChartIcon',
  'Analytics01Icon',
  'Presentation01Icon',
  'WhiteboardIcon',
  'Flowchart01Icon',
  'KanbanIcon',
  'MymindIcon',
  'Layers01Icon',
  'Table02Icon',
  'LayoutLeftIcon',
  'GridIcon',
  'Briefcase01Icon',
  'Building01Icon',
  'Store01Icon',
  'Factory01Icon',
  'BankIcon',
  'CreditCardIcon',
  'Wallet01Icon',
  'Money01Icon',
  'Invoice01Icon',
  'Home05Icon',
  'Building06Icon',
  'School01Icon',
  'GraduationCapIcon',
  'BookOpen01Icon',
  'LibraryIcon',
  'NewspaperIcon',
  'NewsIcon',
  'Mail01Icon',
  'InboxDownloadIcon',
  'SentIcon',
  'Message01Icon',
  'Chat01Icon',
  'Comment01Icon',
  'Megaphone01Icon',
  'Mic01Icon',
  'HeadphonesIcon',
  'Video01Icon',
  'Camera01Icon',
  'Image01Icon',
  'Film01Icon',
  'MusicNote01Icon',
  'PaintBrush01Icon',
  'ColorsIcon',
  'MagicWand01Icon',
  'CodeIcon',
  'TerminalIcon',
  'Database01Icon',
  'ServerIcon',
  'CloudIcon',
  'Wifi01Icon',
  'Globe02Icon',
  'Compass01Icon',
  'MapIcon',
  'Location01Icon',
  'Airplane01Icon',
  'Car01Icon',
  'Bus01Icon',
  'Train01Icon',
  'Bicycle01Icon',
  'CargoShipIcon',
  'PackageIcon',
  'DeliveryBox01Icon',
  'ShoppingBag01Icon',
  'GiftIcon',
  'Coffee01Icon',
  'Pizza01Icon',
  'Restaurant01Icon',
  'Plant01Icon',
  'Tree01Icon',
  'Sun01Icon',
  'Moon01Icon',
  'CloudRainIcon',
  'SnowIcon',
  'UserIcon',
  'UserGroupIcon',
  'AddTeamIcon',
  'HandshakeIcon',
  'Link01Icon',
  'Attachment01Icon',
  'SearchVisualIcon',
  'Settings01Icon',
  'Wrench01Icon',
  'HammerIcon',
  'LockIcon',
  'Shield01Icon',
  'Key01Icon',
  'Legal01Icon',
  'JusticeScale01Icon',
  'Hospital01Icon',
  'FirstAidKitIcon',
  'HeartCheckIcon',
  'PillIcon',
  'Dumbbell01Icon',
  'Yoga01Icon',
  'RunningShoesIcon',
  'FootballIcon',
  'Basketball01Icon',
  'GameController01Icon',
  'DiceIcon',
  'PuzzleIcon',
  'ChessPawnIcon',
  'GhostIcon',
  'Alien01Icon',
  'Robot01Icon',
  'Satellite01Icon',
  'Telescope01Icon',
  'MicroscopeIcon',
  'Dna01Icon',
  'Atom01Icon',
  'CalculatorIcon',
  'AbacusIcon',
  'Bitcoin01Icon',
  'Bug01Icon',
  'PencilIcon',
] as const

function buildFeaturedCatalog(): PageIconDefinition[] {
  const seen = new Set<string>()
  const catalog: PageIconDefinition[] = []

  for (const iconName of FEATURED_ICON_NAMES) {
    if (!iconExists(iconName)) continue
    const id = iconNameToSlug(iconName)
    if (seen.has(id)) continue
    seen.add(id)
    catalog.push({
      id,
      iconName,
      label: iconNameToLabel(iconName),
    })
  }

  return catalog
}

export const PAGE_ICON_CATALOG = buildFeaturedCatalog()

export const PAGE_ICON_OPTIONS = PAGE_ICON_CATALOG

export type PageIconId = string

const catalogById = new Map(PAGE_ICON_CATALOG.map((entry) => [entry.id, entry]))

export function getPageIconDefinition(id: string): PageIconDefinition | undefined {
  const featured = catalogById.get(id)
  if (featured) return featured

  if (!isPageIconSlug(id)) return undefined

  const iconName = slugToIconName(id)
  if (!iconExists(iconName)) return undefined

  return {
    id,
    iconName,
    label: iconNameToLabel(iconName),
  }
}

export function getPageIconOption(id: string) {
  return getPageIconDefinition(id)
}

export function isPageIconId(id: string): id is PageIconId {
  return getPageIconDefinition(id) !== undefined
}

export function definitionFromIconName(iconName: string): PageIconDefinition | undefined {
  if (!iconExists(iconName)) return undefined
  const id = iconNameToSlug(iconName)
  return getPageIconDefinition(id) ?? {
    id,
    iconName,
    label: iconNameToLabel(iconName),
  }
}
