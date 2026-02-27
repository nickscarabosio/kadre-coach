'use client'

import { useState } from 'react'
import { NotificationPreferences } from '@/types/database'
import { updateNotificationPreferences } from './actions'

const PREF_LABELS: Record<keyof NotificationPreferences, string> = {
  email_daily_synthesis: 'Daily synthesis via email',
  email_check_in_alerts: 'Check-in alerts via email',
  telegram_check_in_alerts: 'Check-in alerts via Telegram',
  telegram_daily_synthesis: 'Daily synthesis via Telegram',
  sms_urgent_alerts: 'Urgent alerts via SMS',
}

export function NotificationSettings({ preferences }: { preferences: NotificationPreferences }) {
  const [prefs, setPrefs] = useState(preferences)
  const [saving, setSaving] = useState(false)

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setSaving(true)
    await updateNotificationPreferences(updated)
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      {(Object.entries(PREF_LABELS) as [keyof NotificationPreferences, string][]).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
          <span className="text-sm text-primary">{label}</span>
          <button
            onClick={() => handleToggle(key)}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              prefs[key] ? 'bg-secondary' : 'bg-primary-10'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                prefs[key] ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  )
}
