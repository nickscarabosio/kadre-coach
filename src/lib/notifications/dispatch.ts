import { createAdminClient } from '@/lib/supabase/server'
import { sendDailySynthesis, sendCheckInAlert } from '@/lib/email/send'
import { sendUrgentAlert } from '@/lib/sms/send'
import type { NotificationPreferences } from '@/types/database'

const DEFAULT_PREFS: NotificationPreferences = {
  email_daily_synthesis: true,
  email_check_in_alerts: true,
  telegram_check_in_alerts: true,
  telegram_daily_synthesis: true,
  sms_urgent_alerts: false,
}

function getPrefs(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFS
  return { ...DEFAULT_PREFS, ...(raw as Record<string, boolean>) }
}

export async function dispatchDailySynthesis(coachId: string, content: string) {
  const supabase = createAdminClient()
  const { data: coach } = await supabase.from('coaches').select('*').eq('id', coachId).single()
  if (!coach) return

  const prefs = getPrefs(coach.notification_preferences)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (prefs.email_daily_synthesis) {
    try {
      await sendDailySynthesis(coach.email, coach.full_name, content, today)
    } catch (e) {
      console.error('Email synthesis dispatch failed:', e)
    }
  }

  if (prefs.telegram_daily_synthesis && coach.telegram_chat_id) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: coach.telegram_chat_id,
            text: `📊 Daily Synthesis — ${today}\n\n${content}`,
          }),
        })
      }
    } catch (e) {
      console.error('Telegram synthesis dispatch failed:', e)
    }
  }
}

export async function dispatchCheckInAlert(coachId: string, clientName: string, energyLevel: number, goalProgress: string) {
  const supabase = createAdminClient()
  const { data: coach } = await supabase.from('coaches').select('*').eq('id', coachId).single()
  if (!coach) return

  const prefs = getPrefs(coach.notification_preferences)

  if (prefs.email_check_in_alerts) {
    try {
      await sendCheckInAlert(coach.email, coach.full_name, clientName, energyLevel, goalProgress)
    } catch (e) {
      console.error('Email check-in alert failed:', e)
    }
  }

  if (prefs.telegram_check_in_alerts && coach.telegram_chat_id) {
    try {
      const emoji = goalProgress === 'yes' ? '🟢' : goalProgress === 'partial' ? '🟡' : '🔴'
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: coach.telegram_chat_id,
            text: `${emoji} New check-in from ${clientName}\nEnergy: ${energyLevel}/10 | Goal: ${goalProgress}`,
          }),
        })
      }
    } catch (e) {
      console.error('Telegram check-in alert failed:', e)
    }
  }

  // SMS only for urgent situations (low energy + off track)
  if (prefs.sms_urgent_alerts && coach.phone && energyLevel <= 3 && goalProgress === 'no') {
    try {
      await sendUrgentAlert(coach.phone, `⚠️ Kadre: ${clientName} reported low energy (${energyLevel}/10) and off-track goals. Check in with them.`)
    } catch (e) {
      console.error('SMS urgent alert failed:', e)
    }
  }
}
