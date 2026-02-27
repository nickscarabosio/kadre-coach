'use client'

import { useState } from 'react'
import { Coach } from '@/types/database'
import { updateProfile } from './actions'
import { useRouter } from 'next/navigation'
import { Share2 } from 'lucide-react'

export function ProfileForm({ coach }: { coach: Coach }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
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

  const getShareText = () => {
    const lines: string[] = [coach.full_name]
    if (coach.bio) lines.push(coach.bio)
    if (coach.phone) lines.push(`Phone: ${coach.phone}`)
    lines.push(`Email: ${coach.email}`)
    if (coach.booking_link) lines.push(`Book a session: ${coach.booking_link}`)
    return lines.join('\n')
  }

  const handleCopyShare = async () => {
    await navigator.clipboard.writeText(getShareText())
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="shrink-0">
            {coach.avatar_url ? (
              <img
                src={coach.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary/20 border border-border flex items-center justify-center text-2xl font-semibold text-secondary">
                {coach.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-primary mb-1.5">Profile picture URL</label>
            <input
              name="avatar_url"
              type="url"
              defaultValue={coach.avatar_url || ''}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            />
          </div>
        </div>

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
          <label className="block text-sm font-medium text-primary mb-1.5">Bio / Details</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={coach.bio ?? ''}
            placeholder="Short bio or profile details to share"
            className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          />
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

        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Booking link</label>
          <input
            name="booking_link"
            type="url"
            defaultValue={coach.booking_link || ''}
            placeholder="https://calendly.com/..."
            className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
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

      <div className="pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-primary mb-2">Share profile via message</h3>
        <p className="text-sm text-muted mb-3">Copy your profile card to paste into Telegram or any message.</p>
        <button
          type="button"
          onClick={handleCopyShare}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 border border-border rounded-lg text-sm font-medium text-primary transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {shareCopied ? 'Copied!' : 'Copy profile to clipboard'}
        </button>
      </div>
    </div>
  )
}
