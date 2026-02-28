'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { GlobalSearch } from '@/components/global-search'
import { getBreadcrumbLabel } from '@/lib/nav-config'

interface HeaderNavProps {
  onMenuClick?: () => void
}

export function HeaderNav({ onMenuClick }: HeaderNavProps) {
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

  const breadcrumb = getBreadcrumbLabel(pathname)

  return (
    <header className="h-14 sticky top-0 z-40 bg-surface border-b border-border shadow-nav flex items-center justify-between px-4 sm:px-6">
      {/* Left: hamburger (mobile) + logo + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-muted hover:text-primary hover:bg-primary-5"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link href="/dashboard" className="text-xl font-bold text-primary shrink-0 md:hidden">
          Kadre
        </Link>
        {breadcrumb && (
          <div className="hidden md:flex items-center gap-1.5 text-sm text-muted min-w-0">
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="font-medium text-primary truncate">{breadcrumb}</span>
          </div>
        )}
      </div>

      {/* Right: search + messages + avatar */}
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
    </header>
  )
}
