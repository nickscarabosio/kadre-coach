import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateDailySynthesis } from '@/lib/ai/synthesize'
import { dispatchDailySynthesis } from '@/lib/notifications/dispatch'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: coaches } = await supabase.from('coaches').select('id')

  const results = []

  for (const coach of coaches || []) {
    try {
      const content = await generateDailySynthesis(coach.id)
      await dispatchDailySynthesis(coach.id, content)
      results.push({ coach_id: coach.id, status: 'ok' })
    } catch (error) {
      console.error(`Synthesis failed for coach ${coach.id}:`, error)
      results.push({ coach_id: coach.id, status: 'error', error: String(error) })
    }
  }

  return NextResponse.json({ results })
}
