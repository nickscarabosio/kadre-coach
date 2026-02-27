import { createClient } from '@/lib/supabase/server'
import { subHours, addHours } from 'date-fns'
import { DashboardClient } from './dashboard-client'

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
    .select('id, content, voice_transcript, message_type, client_id, classification, created_at')
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
    .select('id, client_id, energy_level, accountability_score, goal_progress')
    .order('created_at', { ascending: false })
    .limit(5) : { data: null }

  const reflectionsWithCompany = (recentReflections || []).map(r => ({
    ...r,
    company_name: r.client_id ? clientMap[r.client_id] || 'Unknown' : 'Unknown',
  }))

  return (
    <DashboardClient
      updates={recentUpdates || []}
      tasks={dueSoonTasks || []}
      reflections={reflectionsWithCompany}
      clientMap={clientMap}
      coachName={coach?.full_name || null}
    />
  )
}
