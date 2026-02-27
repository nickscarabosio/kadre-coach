import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import type { NotificationPreferences } from '@/types/database'

const DEFAULT_PREFS: NotificationPreferences = {
  email_daily_synthesis: true,
  email_check_in_alerts: true,
  telegram_check_in_alerts: true,
  telegram_daily_synthesis: true,
  sms_urgent_alerts: false,
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!coach) redirect('/login')

  const rawPrefs = coach.notification_preferences as Record<string, unknown> | null
  const prefs: NotificationPreferences = {
    ...DEFAULT_PREFS,
    ...(rawPrefs ? {
      email_daily_synthesis: rawPrefs.email_daily_synthesis as boolean ?? DEFAULT_PREFS.email_daily_synthesis,
      email_check_in_alerts: rawPrefs.email_check_in_alerts as boolean ?? DEFAULT_PREFS.email_check_in_alerts,
      telegram_check_in_alerts: rawPrefs.telegram_check_in_alerts as boolean ?? DEFAULT_PREFS.telegram_check_in_alerts,
      telegram_daily_synthesis: rawPrefs.telegram_daily_synthesis as boolean ?? DEFAULT_PREFS.telegram_daily_synthesis,
      sms_urgent_alerts: rawPrefs.sms_urgent_alerts as boolean ?? DEFAULT_PREFS.sms_urgent_alerts,
    } : {}),
  }

  const { data: snippets } = await supabase
    .from('coach_message_snippets')
    .select('*')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: true })

  return <SettingsClient coach={coach} prefs={prefs} snippets={snippets ?? []} />
}
