'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  ChevronDown,
  Settings,
  LogOut,
} from 'lucide-react'

interface DropdownItem {
  name: string
  href: string
}

interface NavDropdown {
  label: string
  items: DropdownItem[]
}

const navItems: { label: string; href?: string; dropdown?: NavDropdown }[] = [
  { label: 'Dashboard', href: '/dashboard' },
  {
    label: 'Companies',
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
    dropdown: {
      label: 'Action',
      items: [
        { name: 'Tasks', href: '/tasks' },
        { name: 'Programs', href: '/programs' },
        { name: 'Resources', href: '/resources' },
      ],
    },
  },
]

function Dropdown({
  dropdown,
  isActive,
}: {
  dropdown: NavDropdown
  isActive: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
          isActive
            ? 'text-secondary'
            : 'text-muted hover:text-primary hover:bg-primary-5'
        }`}
      >
        {dropdown.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {isActive && (
        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary" />
      )}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-nav py-1 z-50">
          {dropdown.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-primary hover:bg-primary-5 transition-colors"
            >
              {item.name}
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
  const avatarRef = useRef<HTMLDivElement>(null)

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

  const isPathActive = (item: typeof navItems[number]) => {
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + '/')
    }
    if (item.dropdown) {
      return item.dropdown.items.some(
        (d) => pathname === d.href || pathname.startsWith(d.href + '/')
      )
    }
    return false
  }

  return (
    <header className="h-16 sticky top-0 z-50 bg-surface border-b border-border shadow-nav flex items-center px-6">
      <Link href="/dashboard" className="text-xl font-bold text-primary mr-8">
        Kadre
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = isPathActive(item)

          if (item.dropdown) {
            return (
              <Dropdown
                key={item.label}
                dropdown={item.dropdown}
                isActive={active}
              />
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                active
                  ? 'text-secondary'
                  : 'text-muted hover:text-primary hover:bg-primary-5'
              }`}
            >
              {item.label}
              {active && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
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
            className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-semibold hover:bg-secondary/90 transition-colors"
          >
            K
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
