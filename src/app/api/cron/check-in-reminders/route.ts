import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all active clients with their coach info
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company_name, email, access_token, coach_id')
    .eq('status', 'active')

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: 'No active clients' })
  }

  // Check which clients haven't checked in this week
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: recentReflections } = await supabase
    .from('reflections')
    .select('client_id')
    .in('client_id', clients.map(c => c.id))
    .gte('created_at', weekAgo)

  const checkedInIds = new Set((recentReflections || []).map(r => r.client_id))
  const needsReminder = clients.filter(c => !checkedInIds.has(c.id))

  // Notify coaches about missing check-ins via Telegram
  const coachGroups = needsReminder.reduce((acc, c) => {
    if (!acc[c.coach_id]) acc[c.coach_id] = []
    acc[c.coach_id].push(c.company_name || c.name)
    return acc
  }, {} as Record<string, string[]>)

  const botToken = process.env.TELEGRAM_BOT_TOKEN

  for (const [coachId, companies] of Object.entries(coachGroups)) {
    const { data: coach } = await supabase
      .from('coaches')
      .select('telegram_chat_id')
      .eq('id', coachId)
      .single()

    if (coach?.telegram_chat_id && botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: coach.telegram_chat_id,
          text: `📋 Check-in reminder:\n\nThese companies haven't checked in this week:\n${companies.map(c => `• ${c}`).join('\n')}`,
        }),
      })
    }
  }

  return NextResponse.json({
    reminded: needsReminder.length,
    coaches_notified: Object.keys(coachGroups).length,
  })
}
