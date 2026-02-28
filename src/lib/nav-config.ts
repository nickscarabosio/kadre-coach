import {
  LayoutDashboard,
  Building2,
  Users,
  Rss,
  BookOpen,
  CheckSquare,
  Layers,
  Library,
  FileText,
  MessageSquare,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  section?: string
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },

  // Companies
  { label: 'All Companies', href: '/clients', icon: Building2, section: 'Companies' },
  { label: 'People', href: '/people', icon: Users, section: 'Companies' },

  // Updates
  { label: 'Updates', href: '/updates', icon: Rss, section: 'Updates' },
  { label: 'Syntheses', href: '/syntheses', icon: BookOpen, section: 'Updates' },

  // Action
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, section: 'Action' },
  { label: 'Programs', href: '/programs', icon: Layers, section: 'Action' },
  { label: 'Library', href: '/library', icon: Library, section: 'Action' },
  { label: 'Forms', href: '/forms', icon: FileText, section: 'Action' },
]

export const messagesItem: NavItem = {
  label: 'Messages',
  href: '/messages',
  icon: MessageSquare,
}

export const pathLabelMap: Record<string, string> = Object.fromEntries([
  ...navItems.map((n) => [n.href, n.label]),
  [messagesItem.href, messagesItem.label],
  ['/settings', 'Settings'],
])

/** Get breadcrumb label for a pathname (exact or prefix match). */
export function getBreadcrumbLabel(pathname: string): string | null {
  if (pathLabelMap[pathname]) return pathLabelMap[pathname]
  // Check prefix matches for detail pages like /clients/[id]
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const base = '/' + segments[0]
    if (pathLabelMap[base]) return pathLabelMap[base]
  }
  return null
}
