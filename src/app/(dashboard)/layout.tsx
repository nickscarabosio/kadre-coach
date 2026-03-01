import { DashboardShell } from '@/components/dashboard-shell'
import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}
