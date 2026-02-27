import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { subHours, addHours } from 'date-fns'
import { DashboardClient } from './dashboard-client'

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

  // Tasks due in 48 hours
  const fortyEightHoursFromNow = addHours(new Date(), 48).toISOString().split('T')[0]
  const { data: dueSoonTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', coachId)
    .neq('status', 'completed')
    .lte('due_date', fortyEightHoursFromNow)
    .order('due_date', { ascending: true })
    .limit(10)

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

  // Active projects across all clients
  const { data: activeProjects } = await supabase
    .from('client_projects')
    .select('id, client_id, title, due_date')
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .order('due_date', { ascending: true, nullsFirst: false })

  const activeProjectsWithCompany = (activeProjects || []).map(p => ({
    ...p,
    company_name: p.client_id ? clientMap[p.client_id] || 'Unknown' : 'Unknown',
  }))

  return (
    <DashboardClient
      updates={recentUpdates || []}
      tasks={dueSoonTasks || []}
      reflections={reflectionsWithCompany}
      clientMap={clientMap}
      coachName={coach?.full_name || null}
      activeProjects={activeProjectsWithCompany}
    />
  )
}
