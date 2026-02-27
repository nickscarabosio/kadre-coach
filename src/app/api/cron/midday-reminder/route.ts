import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Get coaches with pending tasks due today
  const { data: dueTasks } = await supabase
    .from('tasks')
    .select('coach_id, title, priority')
    .eq('status', 'pending')
    .lte('due_date', today)

  if (!dueTasks || dueTasks.length === 0) {
    return NextResponse.json({ message: 'No due tasks' })
  }

  const coachTasks = dueTasks.reduce((acc, t) => {
    if (!acc[t.coach_id]) acc[t.coach_id] = []
    acc[t.coach_id].push(t)
    return acc
  }, {} as Record<string, typeof dueTasks>)

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  let notified = 0

  for (const [coachId, tasks] of Object.entries(coachTasks)) {
    const { data: coach } = await supabase
      .from('coaches')
      .select('telegram_chat_id')
      .eq('id', coachId)
      .single()

    if (coach?.telegram_chat_id && botToken) {
      const taskList = tasks.map(t => {
        const emoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '⚪'
        return `${emoji} ${t.title}`
      }).join('\n')

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: coach.telegram_chat_id,
          text: `⏰ Midday reminder — ${tasks.length} task(s) due:\n\n${taskList}`,
        }),
      })
      notified++
    }
  }

  return NextResponse.json({ coaches_notified: notified, tasks: dueTasks.length })
}
