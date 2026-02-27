'use client'

import { useState } from 'react'
import { Coach } from '@/types/database'
import { updateProfile } from './actions'
import { useRouter } from 'next/navigation'

export function ProfileForm({ coach }: { coach: Coach }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage('Profile updated successfully')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-primary mb-1.5">Full Name</label>
        <input
          name="full_name"
          type="text"
          defaultValue={coach.full_name}
          className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
        <input
          type="email"
          value={coach.email}
          disabled
          className="w-full px-4 py-2.5 bg-primary-5 border border-border rounded-lg text-muted cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-1.5">Timezone</label>
        <select
          name="timezone"
          defaultValue={coach.timezone}
          className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Central European</option>
          <option value="Asia/Tokyo">Tokyo</option>
          <option value="Australia/Sydney">Sydney</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-1.5">Phone</label>
        <input
          name="phone"
          type="tel"
          defaultValue={coach.phone || ''}
          className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes('error') || message.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
