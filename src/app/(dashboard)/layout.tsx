import { HeaderNav } from '@/components/header-nav'
import { Toaster } from 'sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <HeaderNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
