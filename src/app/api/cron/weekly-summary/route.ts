import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAIClient, MODELS } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const { data: coaches } = await supabase.from('coaches').select('id, full_name, telegram_chat_id')
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  let sent = 0

  for (const coach of coaches || []) {
    if (!coach.telegram_chat_id || !botToken) continue

    // Gather week's data
    const { data: updates } = await supabase
      .from('telegram_updates')
      .select('content, classification, client_id')
      .eq('coach_id', coach.id)
      .gte('created_at', weekAgo)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, status')
      .eq('coach_id', coach.id)
      .gte('created_at', weekAgo)

    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('coach_id', coach.id)

    const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))

    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
    const totalUpdates = updates?.length || 0

    // Generate summary with AI
    const ai = getAIClient()
    const summary = await ai.messages.create({
      model: MODELS.haiku,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Create a brief weekly summary for a coach named ${coach.full_name}:\n\n` +
          `Updates logged: ${totalUpdates}\n` +
          `Tasks completed: ${completedTasks} of ${tasks?.length || 0}\n` +
          `Companies with activity: ${[...new Set(updates?.map(u => u.client_id).filter(Boolean).map(id => clientMap[id!]))].join(', ') || 'None'}\n\n` +
          `Keep it under 200 words. Be encouraging and highlight key achievements.`,
      }],
    })

    const text = summary.content[0].type === 'text' ? summary.content[0].text : 'Weekly summary unavailable.'

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: coach.telegram_chat_id,
        text: `📅 Weekly Summary\n\n${text}`,
      }),
    })
    sent++
  }

  return NextResponse.json({ summaries_sent: sent })
}
