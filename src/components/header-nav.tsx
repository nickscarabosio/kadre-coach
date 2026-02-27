'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  Building2,
  Rss,
  Zap,
} from 'lucide-react'

interface DropdownItem {
  name: string
  href: string
}

interface NavDropdown {
  label: string
  hubHref: string
  items: DropdownItem[]
}

interface NavItemBase {
  label: string
  icon: typeof LayoutDashboard
}
interface NavLink extends NavItemBase {
  href: string
  dropdown?: never
}
interface NavDropdownItem extends NavItemBase {
  href?: never
  dropdown: NavDropdown
}

const navItems: (NavLink | NavDropdownItem)[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Companies',
    icon: Building2,
    dropdown: {
      label: 'Companies',
      hubHref: '/clients/hub',
      items: [
        { name: 'All Companies', href: '/clients' },
        { name: 'People', href: '/people' },
      ],
    },
  },
  {
    label: 'Updates',
    icon: Rss,
    dropdown: {
      label: 'Updates',
      hubHref: '/updates/hub',
      items: [
        { name: 'Updates', href: '/updates' },
        { name: 'Syntheses', href: '/syntheses' },
      ],
    },
  },
  {
    label: 'Action',
    icon: Zap,
    dropdown: {
      label: 'Action',
      hubHref: '/action/hub',
      items: [
        { name: 'Tasks', href: '/tasks' },
        { name: 'Programs', href: '/programs' },
        { name: 'Library', href: '/library' },
        { name: 'Forms', href: '/forms' },
      ],
    },
  },
]

const HOVER_DELAY_MS = 150

function NavDropdown({
  item,
  isActive,
}: {
  item: NavDropdownItem
  isActive: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | NodeJS.Timeout | null>(null)

  const clearTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleMouseEnter = () => {
    clearTimeout()
    timeoutRef.current = window.setTimeout(() => setOpen(true), HOVER_DELAY_MS)
  }

  const handleMouseLeave = () => {
    clearTimeout()
    timeoutRef.current = window.setTimeout(() => setOpen(false), HOVER_DELAY_MS)
  }

  useEffect(() => {
    return () => clearTimeout()
  }, [])

  const Icon = item.icon
  const { dropdown } = item

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={dropdown.hubHref}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
          isActive
            ? 'text-secondary'
            : 'text-muted hover:text-primary hover:bg-primary-5'
        }`}
      >
        <Icon className="w-4 h-4" />
        {dropdown.label}
      </Link>
      {isActive && (
        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary" />
      )}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-nav py-1 z-50">
          {dropdown.items.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              className="block px-4 py-2 text-sm text-primary hover:bg-primary-5 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function HeaderNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [coach, setCoach] = useState<{ avatar_url: string | null; full_name: string | null }>({ avatar_url: null, full_name: null })
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadCoach() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('coaches').select('avatar_url, full_name').eq('id', user.id).single()
      if (data) setCoach({ avatar_url: data.avatar_url ?? null, full_name: data.full_name ?? null })
    }
    loadCoach()
  }, [supabase])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isPathActive = (item: (NavLink | NavDropdownItem)) => {
    if ('href' in item && item.href) {
      return pathname === item.href || pathname.startsWith(item.href + '/')
    }
    if ('dropdown' in item && item.dropdown) {
      const d = item.dropdown
      return pathname === d.hubHref || d.items.some(
        (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
      )
    }
    return false
  }

  return (
    <header className="h-16 sticky top-0 z-50 bg-surface border-b border-border shadow-nav flex items-center justify-between px-6">
      <Link href="/dashboard" className="text-xl font-bold text-primary shrink-0">
        Kadre
      </Link>

      <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {navItems.map((item) => {
          const active = isPathActive(item)
          const Icon = item.icon

          if ('dropdown' in item && item.dropdown) {
            return (
              <NavDropdown
                key={item.label}
                item={item}
                isActive={active}
              />
            )
          }

          const linkItem = item as NavLink
          return (
            <Link
              key={linkItem.label}
              href={linkItem.href}
              className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                active
                  ? 'text-secondary'
                  : 'text-muted hover:text-primary hover:bg-primary-5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {linkItem.label}
              {active && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/messages"
          className={`p-2 rounded-lg transition-colors ${
            pathname.startsWith('/messages')
              ? 'text-secondary bg-secondary-10'
              : 'text-muted hover:text-primary hover:bg-primary-5'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
        </Link>

        <div ref={avatarRef} className="relative">
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-semibold hover:bg-secondary/90 transition-colors overflow-hidden shrink-0"
          >
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (coach.full_name?.charAt(0) || 'K').toUpperCase()
            )}
          </button>
          {avatarOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-nav py-1 z-50">
              <Link
                href="/settings"
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
