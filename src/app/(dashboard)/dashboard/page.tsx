import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: coach } = user ? await supabase
    .from('coaches')
    .select('*')
    .eq('id', user.id)
    .single() : { data: null }

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id) : { data: null }

  const totalClients = clients?.length || 0
  const activeClients = clients?.filter(c => c.status === 'active').length || 0
  const atRiskClients = clients?.filter(c => c.status === 'at_risk').length || 0

  const { data: recentReflections } = await supabase
    .from('reflections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: pendingTasks } = user ? await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', user.id)
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(5) : { data: null }

  const stats = [
    { name: 'Total Clients', value: totalClients, icon: Users, color: 'bg-blue-500/10 text-blue-400' },
    { name: 'Active', value: activeClients, icon: TrendingUp, color: 'bg-green-500/10 text-green-400' },
    { name: 'At Risk', value: atRiskClients, icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-400' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{coach?.full_name ? `, ${coach.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-zinc-400 mt-1">Here&apos;s what&apos;s happening with your clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-zinc-400">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Check-ins</h2>
          {recentReflections && recentReflections.length > 0 ? (
            <div className="space-y-3">
              {recentReflections.map((reflection) => (
                <div key={reflection.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-white font-medium">
                      Client Check-in
                    </p>
                    <p className="text-sm text-zinc-400">
                      Energy: {reflection.energy_level}/10 • Accountability: {reflection.accountability_score}/10
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    reflection.goal_progress === 'yes'
                      ? 'bg-green-500/10 text-green-400'
                      : reflection.goal_progress === 'partial'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {reflection.goal_progress === 'yes' ? 'On track' : reflection.goal_progress === 'partial' ? 'Partial' : 'Off track'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No recent check-ins yet</p>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Tasks</h2>
          {pendingTasks && pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0">
                  <CheckCircle className="w-5 h-5 text-zinc-600" />
                  <div className="flex-1">
                    <p className="text-white">{task.title}</p>
                    {task.due_date && (
                      <p className="text-sm text-zinc-400">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'high'
                      ? 'bg-red-500/10 text-red-400'
                      : task.priority === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No pending tasks</p>
          )}
        </div>
      </div>
    </div>
  )
}
