import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { subHours, addHours } from 'date-fns'
import { DashboardClient } from './dashboard-client'

const todayIso = () => new Date().toISOString().split('T')[0]

export default async function DashboardPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const { data: coach } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', coachId)
    .single()

  // Recent updates (last 24 hours)
  const twentyFourHoursAgo = subHours(new Date(), 24).toISOString()
  const { data: recentUpdates } = await supabase
    .from('telegram_updates')
    .select('id, content, voice_transcript, message_type, client_id, classification, created_at')
    .eq('coach_id', coachId)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get clients for company names
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('coach_id', coachId)

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))
  const clientIds = (clients || []).map(c => c.id)

  const fortyEightHoursFromNow = addHours(new Date(), 48).toISOString().split('T')[0]

  // Overdue tasks (due_date < today, not completed)
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', coachId)
    .neq('status', 'completed')
    .lt('due_date', todayIso())
    .order('due_date', { ascending: true })
    .limit(20)

  // Tasks due in next 48 hours (including today)
  const { data: dueSoonTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', coachId)
    .neq('status', 'completed')
    .gte('due_date', todayIso())
    .lte('due_date', fortyEightHoursFromNow)
    .order('due_date', { ascending: true })
    .limit(20)

  // Recent check-ins
  const { data: recentReflections } = clientIds.length > 0 ? await supabase
    .from('reflections')
    .select('id, client_id, energy_level, accountability_score, goal_progress')
    .in('client_id', clientIds)
    .order('created_at', { ascending: false })
    .limit(5)
    : { data: null }

  const reflectionsWithCompany = (recentReflections || []).map(r => ({
    ...r,
    company_name: r.client_id ? clientMap[r.client_id] || 'Unknown' : 'Unknown',
  }))

  // Active projects with created_at for start date
  const { data: activeProjects } = await supabase
    .from('client_projects')
    .select('id, client_id, title, due_date, created_at, status')
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .order('due_date', { ascending: true, nullsFirst: false })

  const activeProjectsWithCompany = (activeProjects || []).map(p => ({
    ...p,
    company_name: p.client_id ? clientMap[p.client_id] || 'Unknown' : 'Unknown',
  }))

  const clientsList = clients || []

  // KPI counts
  const [overdueCount, dueTodayCount, inProgressCount, completedCount] = await Promise.all([
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .neq('status', 'completed')
      .lt('due_date', todayIso()),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .neq('status', 'completed')
      .eq('due_date', todayIso()),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'in_progress'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'completed'),
  ])

  const kpiCounts = {
    overdue: overdueCount.count ?? 0,
    dueToday: dueTodayCount.count ?? 0,
    inProgress: inProgressCount.count ?? 0,
    completed: completedCount.count ?? 0,
  }

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, full_name')
    .order('full_name')

  return (
    <DashboardClient
      overdueTasks={overdueTasks || []}
      dueSoonTasks={dueSoonTasks || []}
      clientMap={clientMap}
      coachName={coach?.full_name || null}
      coachId={coachId}
      activeProjects={activeProjectsWithCompany}
      clients={clientsList}
      kpiCounts={kpiCounts}
      coaches={coaches || []}
    />
  )
}
