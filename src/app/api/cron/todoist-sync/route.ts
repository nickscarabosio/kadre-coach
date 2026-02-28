import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { syncCoachTasks } from '@/lib/todoist/sync'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, todoist_api_token')
    .eq('todoist_sync_enabled', true)
    .not('todoist_api_token', 'is', null)

  const results = []

  for (const coach of coaches || []) {
    try {
      const result = await syncCoachTasks(supabase, coach.id, coach.todoist_api_token!)
      results.push({
        coach_id: coach.id,
        status: 'ok',
        pushed: result.pushed,
        pulled: result.pulled,
        errors: result.errors,
      })
    } catch (error) {
      console.error(`Todoist sync failed for coach ${coach.id}:`, error)
      results.push({ coach_id: coach.id, status: 'error', error: String(error) })
    }
  }

  return NextResponse.json({ results })
}
