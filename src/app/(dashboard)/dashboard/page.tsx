import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Tag, Clock } from 'lucide-react'
import { format, isAfter, subHours, addHours } from 'date-fns'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: coach } = user ? await supabase
    .from('coaches')
    .select('*')
    .eq('id', user.id)
    .single() : { data: null }

  // Recent updates (last 24 hours)
  const twentyFourHoursAgo = subHours(new Date(), 24).toISOString()
  const { data: recentUpdates } = user ? await supabase
    .from('telegram_updates')
    .select('*')
    .eq('coach_id', user.id)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(10) : { data: null }

  // Get clients for company names
  const { data: clients } = user ? await supabase
    .from('clients')
    .select('id, company_name')
    .eq('coach_id', user.id) : { data: null }

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))

  // Tasks due in 48 hours
  const fortyEightHoursFromNow = addHours(new Date(), 48).toISOString().split('T')[0]
  const { data: dueSoonTasks } = user ? await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', user.id)
    .neq('status', 'completed')
    .lte('due_date', fortyEightHoursFromNow)
    .order('due_date', { ascending: true })
    .limit(10) : { data: null }

  // Recent check-ins
  const { data: recentReflections } = user ? await supabase
    .from('reflections')
    .select('*, clients!inner(company_name)')
    .order('created_at', { ascending: false })
    .limit(5) : { data: null }

  const classColors: Record<string, string> = {
    progress: 'bg-emerald-50 text-emerald-700',
    blocker: 'bg-red-50 text-red-700',
    communication: 'bg-blue-50 text-blue-700',
    insight: 'bg-purple-50 text-purple-700',
    admin: 'bg-primary-5 text-muted',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">
          Welcome back{coach?.full_name ? `, ${coach.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted mt-1">Here&apos;s what&apos;s happening with your companies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Check-ins */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-primary mb-4">Recent Check-ins</h2>
          {recentReflections && recentReflections.length > 0 ? (
            <div className="space-y-3">
              {recentReflections.map((reflection: Record<string, unknown>) => (
                <div key={reflection.id as string} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-primary font-medium">
                      {(reflection.clients as Record<string, string>)?.company_name || 'Client Check-in'}
                    </p>
                    <p className="text-sm text-muted">
                      Energy: {reflection.energy_level as number}/10 · Accountability: {reflection.accountability_score as number}/10
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    reflection.goal_progress === 'yes'
                      ? 'bg-emerald-50 text-emerald-700'
                      : reflection.goal_progress === 'partial'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {reflection.goal_progress === 'yes' ? 'On track' : reflection.goal_progress === 'partial' ? 'Partial' : 'Off track'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No recent check-ins yet</p>
          )}
        </div>

        {/* Recent Updates (Last 24h) */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Recent Updates (Last 24h)</h2>
            <Link href="/updates" className="text-sm text-secondary hover:text-secondary/80">View all</Link>
          </div>
          {recentUpdates && recentUpdates.length > 0 ? (
            <div className="space-y-3">
              {recentUpdates.slice(0, 5).map((update) => {
                const company = update.client_id ? clientMap[update.client_id] : null
                return (
                  <div key={update.id} className="py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      {company && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-10 px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3" />
                          {company}
                        </span>
                      )}
                      {update.classification && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classColors[update.classification] || 'bg-primary-5 text-muted'}`}>
                          {update.classification}
                        </span>
                      )}
                      <span className="text-xs text-muted ml-auto">
                        {format(new Date(update.created_at), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-primary/80 line-clamp-2">{update.content}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted text-sm">No updates in the last 24 hours</p>
          )}
        </div>
      </div>

      {/* Tasks Due in 48 Hours */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Due in 48 Hours</h2>
          <Link href="/tasks" className="text-sm text-secondary hover:text-secondary/80">View all tasks</Link>
        </div>
        {dueSoonTasks && dueSoonTasks.length > 0 ? (
          <div className="space-y-3">
            {dueSoonTasks.map((task) => {
              const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59'))
              return (
                <div key={task.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <CheckCircle className="w-5 h-5 text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-primary text-sm">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.client_id && clientMap[task.client_id] && (
                        <span className="text-xs text-muted">{clientMap[task.client_id]}</span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600' : 'text-muted'}`}>
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.priority === 'high'
                      ? 'bg-red-50 text-red-700'
                      : task.priority === 'medium'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-primary-5 text-muted'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted text-sm">No tasks due soon</p>
        )}
      </div>
    </div>
  )
}
