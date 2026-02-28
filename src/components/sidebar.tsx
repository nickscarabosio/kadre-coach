'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen, X, Sun, Moon } from 'lucide-react'
import { navItems, messagesItem, type NavItem } from '@/lib/nav-config'

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

const COLLAPSED_KEY = 'sidebar-collapsed'
const THEME_KEY = 'theme'

function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  onClick?: () => void
}) {
  const active = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-secondary-10 text-secondary'
          : 'text-muted hover:text-primary hover:bg-primary-5'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  pathname,
  onNavigate,
  isMobile,
}: {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  pathname: string
  onNavigate?: () => void
  isMobile: boolean
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null
    if (stored) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // Group items by section
  const standalone = navItems.filter((n) => !n.section)
  const sections = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (item.section) {
      if (!acc[item.section]) acc[item.section] = []
      acc[item.section].push(item)
    }
    return acc
  }, {})

  const effectiveCollapsed = isMobile ? false : collapsed

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-border px-4 shrink-0 ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!effectiveCollapsed && (
          <Link href="/dashboard" className="text-xl font-bold text-primary" onClick={onNavigate}>
            Kadre
          </Link>
        )}
        {isMobile ? (
          <button
            type="button"
            onClick={onNavigate}
            className="p-2 rounded-lg text-muted hover:bg-primary-5"
          >
            <X className="w-5 h-5" />
          </button>
        ) : effectiveCollapsed ? (
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            K
          </Link>
        ) : null}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {standalone.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={effectiveCollapsed}
            onClick={onNavigate}
          />
        ))}

        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="pt-3">
            {!effectiveCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                {section}
              </p>
            )}
            {effectiveCollapsed && (
              <div className="border-t border-border mx-2 mb-2" />
            )}
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={effectiveCollapsed}
                onClick={onNavigate}
              />
            ))}
          </div>
        ))}

        {/* Divider + Messages */}
        <div className="pt-3">
          {!effectiveCollapsed && <div className="border-t border-border mx-2 mb-2" />}
          {effectiveCollapsed && <div className="border-t border-border mx-2 mb-2" />}
          <NavLink
            item={messagesItem}
            pathname={pathname}
            collapsed={effectiveCollapsed}
            onClick={onNavigate}
          />
        </div>
      </nav>

      {/* Bottom area: theme toggle + collapse toggle */}
      <div className="border-t border-border p-3 space-y-1 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-primary-5 transition-colors w-full ${effectiveCollapsed ? 'justify-center' : ''}`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5 shrink-0" /> : <Sun className="w-5 h-5 shrink-0" />}
          {!effectiveCollapsed && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
        </button>
        {!isMobile && (
          <button
            type="button"
            onClick={() => {
              const next = !collapsed
              setCollapsed(next)
              localStorage.setItem(COLLAPSED_KEY, String(next))
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-primary-5 transition-colors w-full ${effectiveCollapsed ? 'justify-center' : ''}`}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 shrink-0" />
            ) : (
              <PanelLeftClose className="w-5 h-5 shrink-0" />
            )}
            {!effectiveCollapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-surface border-r border-border shrink-0 transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pathname={pathname}
          isMobile={false}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="absolute top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-surface border-r border-border shadow-nav overflow-hidden">
            <SidebarContent
              collapsed={false}
              setCollapsed={() => {}}
              pathname={pathname}
              onNavigate={onMobileClose}
              isMobile={true}
            />
          </aside>
        </div>
      )}
    </>
  )
}
