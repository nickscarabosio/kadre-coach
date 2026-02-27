'use client'

import { useState, useEffect } from 'react'
import { inviteTeamMember, removeTeamMember, getTeamMembers } from './team-actions'
import { Plus, X, Trash2, Users, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TeamMember {
  id: string
  email: string
  full_name: string
  created_at: string
  telegram_chat_id: number | null
  telegram_username: string | null
}

export function TeamManagement({ isOwner }: { isOwner: boolean }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    const result = await getTeamMembers()
    if (result.data) setMembers(result.data)
    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInviting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await inviteTeamMember(formData)

    if (result.error) {
      setError(result.error)
      setInviting(false)
      return
    }

    setShowInvite(false)
    setInviting(false)
    loadMembers()
    router.refresh()
  }

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team? Their account will be deleted.`)) return

    const result = await removeTeamMember(memberId)
    if (result.error) {
      setError(result.error)
      return
    }

    loadMembers()
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-primary">Team Members</h3>
          <p className="text-xs text-muted mt-0.5">People who share access to this account</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Member
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-muted py-4">Loading...</p>
      ) : members.length > 0 ? (
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-primary-5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-10 flex items-center justify-center text-secondary text-sm font-semibold">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">{member.full_name}</p>
                  <p className="text-xs text-muted">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.telegram_username && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <MessageSquare className="w-3 h-3" />
                    @{member.telegram_username}
                  </span>
                )}
                {isOwner && (
                  <button
                    onClick={() => handleRemove(member.id, member.full_name)}
                    className="text-muted hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-primary-5 rounded-lg">
          <Users className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No team members yet</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Full Name *</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Matt Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="matt@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Password *</label>
                <input
                  name="password"
                  type="text"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Temporary password"
                />
                <p className="text-xs text-muted mt-1">Share this with the team member so they can log in</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {inviting ? 'Creating...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
