'use client'

import { useState } from 'react'
import { HeaderNav } from '@/components/header-nav'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from 'sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <HeaderNav onMenuClick={() => setSidebarMobileOpen(true)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
