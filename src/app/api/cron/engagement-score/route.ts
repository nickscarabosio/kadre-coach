import { createAdminClient } from '@/lib/supabase/server'
import { computeEngagementScore, weeksAgo, WEEKS_LOOKBACK } from '@/lib/engagement'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Recompute engagement_score for all clients. Call via cron or on-demand.
 * Uses reflections, telegram_updates, and tasks from the last 4 weeks.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const since = weeksAgo(WEEKS_LOOKBACK)
  const sinceIso = since + 'T00:00:00.000Z'
  const today = weeksAgo(0)

  const { data: reflections } = await supabase
    .from('reflections')
    .select('client_id')
    .gte('created_at', sinceIso)

  const reflectionCountByClient: Record<string, number> = {}
  for (const r of reflections || []) {
    if (r.client_id) {
      reflectionCountByClient[r.client_id] = (reflectionCountByClient[r.client_id] || 0) + 1
    }
  }

  const { data: updates } = await supabase
    .from('telegram_updates')
    .select('client_id')
    .gte('created_at', sinceIso)
    .not('client_id', 'is', null)

  const updateCountByClient: Record<string, number> = {}
  for (const u of updates || []) {
    if (u.client_id) {
      updateCountByClient[u.client_id] = (updateCountByClient[u.client_id] || 0) + 1
    }
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('client_id, status, due_date')
    .gte('due_date', since)
    .lte('due_date', today)
    .not('client_id', 'is', null)

  const tasksTotalByClient: Record<string, number> = {}
  const tasksCompletedByClient: Record<string, number> = {}
  for (const t of tasks || []) {
    if (t.client_id) {
      tasksTotalByClient[t.client_id] = (tasksTotalByClient[t.client_id] || 0) + 1
      if (t.status === 'completed') {
        tasksCompletedByClient[t.client_id] = (tasksCompletedByClient[t.client_id] || 0) + 1
      }
    }
  }

  const { data: clients } = await supabase.from('clients').select('id')

  let updated = 0
  for (const client of clients || []) {
    const score = computeEngagementScore({
      reflectionCount: reflectionCountByClient[client.id] || 0,
      updateCount: updateCountByClient[client.id] || 0,
      tasksCompleted: tasksCompletedByClient[client.id] || 0,
      tasksTotal: tasksTotalByClient[client.id] || 0,
    })

    const { error } = await supabase
      .from('clients')
      .update({ engagement_score: score })
      .eq('id', client.id)

    if (!error) updated++
  }

  return Response.json({ updated, total: (clients || []).length })
}
