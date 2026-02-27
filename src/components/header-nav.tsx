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
  Menu,
  X,
} from 'lucide-react'
import { GlobalSearch } from '@/components/global-search'

interface DropdownItem {
  name: string
  href: string
}

interface NavDropdown {
  label: string
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
      <button
        type="button"
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
          isActive
            ? 'text-secondary'
            : 'text-muted hover:text-primary hover:bg-primary-5'
        }`}
      >
        <Icon className="w-4 h-4" />
        {dropdown.label}
      </button>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
      return item.dropdown.items.some(
        (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
      )
    }
    return false
  }

  return (
    <header className="h-16 sticky top-0 z-50 bg-surface border-b border-border shadow-nav flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden p-2 rounded-lg text-muted hover:text-primary hover:bg-primary-5"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/dashboard" className="text-xl font-bold text-primary shrink-0">
          Kadre
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
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

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <GlobalSearch />
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
                Account settings
              </Link>
              <Link
                href="/settings#notifications"
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-5 transition-colors"
              >
                Notification preferences
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-5 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-surface border-r border-border shadow-nav overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-bold text-primary">Menu</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg text-muted hover:bg-primary-5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  pathname === '/dashboard' ? 'bg-secondary-10 text-secondary' : 'text-primary hover:bg-primary-5'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <div className="pt-2">
                <p className="px-4 text-xs font-semibold text-muted uppercase tracking-wider mb-1">Companies</p>
                <Link href="/clients" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Building2 className="w-5 h-5" /> All Companies
                </Link>
                <Link href="/people" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Building2 className="w-5 h-5" /> People
                </Link>
              </div>
              <div className="pt-2">
                <p className="px-4 text-xs font-semibold text-muted uppercase tracking-wider mb-1">Updates</p>
                <Link href="/updates" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Rss className="w-5 h-5" /> Updates
                </Link>
                <Link href="/syntheses" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Rss className="w-5 h-5" /> Syntheses
                </Link>
              </div>
              <div className="pt-2">
                <p className="px-4 text-xs font-semibold text-muted uppercase tracking-wider mb-1">Action</p>
                <Link href="/tasks" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Zap className="w-5 h-5" /> Tasks
                </Link>
                <Link href="/programs" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Zap className="w-5 h-5" /> Programs
                </Link>
                <Link href="/library" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Zap className="w-5 h-5" /> Library
                </Link>
                <Link href="/forms" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5">
                  <Zap className="w-5 h-5" /> Forms
                </Link>
              </div>
              <Link href="/messages" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary hover:bg-primary-5 mt-2">
                <MessageSquare className="w-5 h-5" /> Messages
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
