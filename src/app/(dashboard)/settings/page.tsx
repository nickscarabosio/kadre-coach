import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { NotificationSettings } from './notification-settings'
import { TelegramConnect } from './telegram-connect'
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

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-muted mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-8">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-primary mb-4">Profile</h2>
          <ProfileForm coach={coach} />
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-primary mb-4">Notifications</h2>
          <NotificationSettings preferences={prefs} />
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-primary mb-4">Telegram</h2>
          <TelegramConnect
            isConnected={!!coach.telegram_chat_id}
            username={coach.telegram_username}
          />
        </div>
      </div>
    </div>
  )
}
