import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
} from 'lucide-react'

const todayIso = () => new Date().toISOString().split('T')[0]

export default async function ActionHubPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const today = todayIso()
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { count: overdueCount },
    { count: todayCount },
    { count: weekCount },
    { count: completedTodayCount },
    { data: overdueTasks },
    { data: todayTasks },
    { data: clients },
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId).neq('status', 'completed').lt('due_date', today),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId).neq('status', 'completed').eq('due_date', today),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId).neq('status', 'completed').gt('due_date', today).lte('due_date', sevenDays),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId).eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`),
    supabase.from('tasks').select('id, title, due_date, priority, client_id')
      .eq('coach_id', coachId).neq('status', 'completed').lt('due_date', today)
      .order('due_date').limit(5),
    supabase.from('tasks').select('id, title, due_date, due_time, priority, client_id')
      .eq('coach_id', coachId).neq('status', 'completed').eq('due_date', today)
      .order('priority_level').limit(10),
    supabase.from('clients').select('id, company_name').eq('coach_id', coachId),
  ])

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))

  const stats = [
    { label: 'Overdue', value: overdueCount ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
    { label: 'Due today', value: todayCount ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'This week', value: weekCount ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Done today', value: completedTodayCount ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Action Hub</h1>
        <p className="text-muted mt-1">Your task overview at a glance</p>
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
        {/* Overdue section */}
        <div className="bg-surface border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Overdue
            </h2>
            <Link href="/tasks" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <div className="p-2">
            {overdueTasks && overdueTasks.length > 0 ? overdueTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-5">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{task.title}</p>
                  <p className="text-xs text-muted">
                    {task.due_date}
                    {task.client_id && clientMap[task.client_id] ? ` · ${clientMap[task.client_id]}` : ''}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted text-center py-6">No overdue tasks</p>
            )}
          </div>
        </div>

        {/* Today section */}
        <div className="bg-surface border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-amber-500" />
              Due Today
            </h2>
            <Link href="/tasks" className="text-xs text-secondary hover:underline">View all</Link>
          </div>
          <div className="p-2">
            {todayTasks && todayTasks.length > 0 ? todayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  task.priority === 'urgent' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{task.title}</p>
                  <p className="text-xs text-muted">
                    {task.due_time || 'No time set'}
                    {task.client_id && clientMap[task.client_id] ? ` · ${clientMap[task.client_id]}` : ''}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted text-center py-6">No tasks due today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
