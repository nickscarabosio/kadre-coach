import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Activity,
  FileText,
  MessageSquare,
  Mic,
  Radio,
  TrendingUp,
} from 'lucide-react'

export default async function UpdatesHubPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { data: recentUpdates },
    { count: todayCount },
    { count: weekCount },
    { data: clients },
  ] = await Promise.all([
    supabase.from('telegram_updates')
      .select('id, client_id, content, voice_transcript, message_type, classification, created_at')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase.from('telegram_updates')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .gte('created_at', `${today}T00:00:00`),
    supabase.from('telegram_updates')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .gte('created_at', sevenDaysAgo),
    supabase.from('clients')
      .select('id, company_name')
      .eq('coach_id', coachId),
  ])

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))
  const updates = recentUpdates || []

  // Count by type
  const typeCounts: Record<string, number> = {}
  for (const u of updates) {
    typeCounts[u.message_type] = (typeCounts[u.message_type] || 0) + 1
  }

  // Most active clients this week
  const clientActivity: Record<string, number> = {}
  for (const u of updates) {
    if (u.client_id) clientActivity[u.client_id] = (clientActivity[u.client_id] || 0) + 1
  }
  const mostActive = Object.entries(clientActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ id, name: clientMap[id] || 'Unknown', count }))

  const typeIcon = (type: string) => {
    switch (type) {
      case 'voice': return Mic
      case 'text': return MessageSquare
      case 'document': case 'photo': return FileText
      default: return Radio
    }
  }

  const stats = [
    { label: 'Today', value: todayCount ?? 0, icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'This week', value: weekCount ?? 0, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Text', value: typeCounts['text'] || 0, icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Voice', value: typeCounts['voice'] || 0, icon: Mic, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Updates Hub</h1>
        <p className="text-muted mt-1">Recent activity across all clients</p>
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

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent updates */}
        <div className="md:col-span-2 bg-surface border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-500" />
              Recent Updates
            </h2>
            <Link href="/updates" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <div className="p-2 divide-y divide-border">
            {updates.length > 0 ? updates.slice(0, 8).map(update => {
              const Icon = typeIcon(update.message_type)
              const preview = update.voice_transcript || update.content
              return (
                <div key={update.id} className="flex items-start gap-3 px-3 py-3">
                  <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-primary">
                        {update.client_id ? clientMap[update.client_id] || 'Unknown' : 'Unassigned'}
                      </span>
                      {update.classification && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-10 text-secondary">
                          {update.classification}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted truncate">{preview}</p>
                    <p className="text-[10px] text-muted/60 mt-0.5">
                      {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-8">
                <Radio className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No updates yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Most active clients */}
        <div className="bg-surface border border-border rounded-xl shadow-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Most Active
            </h2>
          </div>
          <div className="p-2">
            {mostActive.length > 0 ? mostActive.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary font-medium truncate">{client.name}</p>
                </div>
                <span className="text-xs text-muted">{client.count} updates</span>
              </Link>
            )) : (
              <p className="text-sm text-muted text-center py-6">No client activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
