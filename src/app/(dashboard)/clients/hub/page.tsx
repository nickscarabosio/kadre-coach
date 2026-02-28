import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import Link from 'next/link'
import {
  AlertTriangle,
  Building,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

export default async function ClientsHubPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: clients },
    { data: overdueTasks },
    { data: recentUpdates },
  ] = await Promise.all([
    supabase.from('clients').select('id, company_name, engagement_score, status, updated_at')
      .eq('coach_id', coachId).order('company_name'),
    supabase.from('tasks').select('client_id')
      .eq('coach_id', coachId).neq('status', 'completed').lt('due_date', today)
      .not('client_id', 'is', null),
    supabase.from('telegram_updates').select('client_id, created_at')
      .eq('coach_id', coachId).not('client_id', 'is', null)
      .order('created_at', { ascending: false }).limit(200),
  ])

  const allClients = clients || []
  const activeClients = allClients.filter(c => c.status === 'active')
  const avgEngagement = activeClients.length > 0
    ? Math.round(activeClients.reduce((s, c) => s + c.engagement_score, 0) / activeClients.length)
    : 0

  // Overdue count per client
  const overdueByClient: Record<string, number> = {}
  for (const t of overdueTasks || []) {
    if (t.client_id) overdueByClient[t.client_id] = (overdueByClient[t.client_id] || 0) + 1
  }

  // Days since last update per client
  const lastUpdateByClient: Record<string, string> = {}
  for (const u of recentUpdates || []) {
    if (u.client_id && !lastUpdateByClient[u.client_id]) {
      lastUpdateByClient[u.client_id] = u.created_at
    }
  }

  // Clients needing attention: low engagement or overdue tasks
  const needsAttention = activeClients
    .map(c => ({
      ...c,
      overdue: overdueByClient[c.id] || 0,
      daysSinceUpdate: lastUpdateByClient[c.id]
        ? Math.floor((Date.now() - new Date(lastUpdateByClient[c.id]).getTime()) / 86400000)
        : 999,
    }))
    .filter(c => c.overdue > 0 || c.engagement_score < 40 || c.daysSinceUpdate > 7)
    .sort((a, b) => b.overdue - a.overdue || a.engagement_score - b.engagement_score)
    .slice(0, 6)

  // Top performers
  const topPerformers = activeClients
    .filter(c => c.engagement_score >= 70)
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .slice(0, 5)

  const stats = [
    { label: 'Total clients', value: allClients.length, icon: Building, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Active', value: activeClients.length, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Avg engagement', value: `${avgEngagement}%`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Need attention', value: needsAttention.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Clients Hub</h1>
        <p className="text-muted mt-1">Client health overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`flex items-center gap-3 p-4 rounded-xl border ${stat.color}`}>
              <Icon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs font-medium opacity-80">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Needs attention */}
        <div className="bg-surface border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Needs Attention
            </h2>
            <Link href="/clients" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <div className="p-2">
            {needsAttention.length > 0 ? needsAttention.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary font-medium truncate">{client.company_name}</p>
                  <p className="text-xs text-muted flex gap-2">
                    {client.overdue > 0 && (
                      <span className="text-red-500">{client.overdue} overdue</span>
                    )}
                    {client.daysSinceUpdate > 7 && client.daysSinceUpdate < 999 && (
                      <span>{client.daysSinceUpdate}d since update</span>
                    )}
                    {client.daysSinceUpdate >= 999 && (
                      <span>No updates</span>
                    )}
                  </p>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  client.engagement_score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                  client.engagement_score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {client.engagement_score}%
                </div>
              </Link>
            )) : (
              <p className="text-sm text-muted text-center py-6">All clients are on track</p>
            )}
          </div>
        </div>

        {/* Top performers */}
        <div className="bg-surface border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Top Performers
            </h2>
          </div>
          <div className="p-2">
            {topPerformers.length > 0 ? topPerformers.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary font-medium truncate">{client.company_name}</p>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {client.engagement_score}%
                </div>
              </Link>
            )) : (
              <div className="text-center py-6">
                <TrendingDown className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No high-engagement clients yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
