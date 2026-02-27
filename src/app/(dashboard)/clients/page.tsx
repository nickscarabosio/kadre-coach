import { createClient } from '@/lib/supabase/server'
import { Building } from 'lucide-react'
import { AddClientButton } from './add-client-button'
import { ClientList } from './client-list'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  // Get latest telegram update per client
  const { data: allUpdates } = user ? await supabase
    .from('telegram_updates')
    .select('client_id, content, created_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  const latestUpdateByClient: Record<string, string> = {}
  for (const u of allUpdates || []) {
    if (u.client_id && !latestUpdateByClient[u.client_id]) {
      latestUpdateByClient[u.client_id] = u.content
    }
  }

  // Get overdue task counts per client
  const today = new Date().toISOString().split('T')[0]
  const { data: overdueTasks } = user ? await supabase
    .from('tasks')
    .select('client_id')
    .eq('coach_id', user.id)
    .neq('status', 'completed')
    .lt('due_date', today)
    .not('client_id', 'is', null) : { data: null }

  const overdueCountByClient: Record<string, number> = {}
  for (const t of overdueTasks || []) {
    if (t.client_id) {
      overdueCountByClient[t.client_id] = (overdueCountByClient[t.client_id] || 0) + 1
    }
  }

  const enrichedClients = (clients || []).map(client => ({
    ...client,
    latest_update: latestUpdateByClient[client.id] || null,
    overdue_task_count: overdueCountByClient[client.id] || 0,
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Companies</h1>
          <p className="text-muted mt-1">{clients?.length || 0} total companies</p>
        </div>
        <AddClientButton />
      </div>

      {clients && clients.length > 0 ? (
        <ClientList clients={enrichedClients} />
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <Building className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No companies yet</h3>
          <p className="text-muted mb-4">Add your first company to get started</p>
          <AddClientButton />
        </div>
      )}
    </div>
  )
}
