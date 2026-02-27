'use client'

import { useState } from 'react'
import { Client, Enrollment } from '@/types/database'
import { assignProgram } from './actions'
import { X, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AssignDialogProps {
  programId: string
  enrollments: (Enrollment & { clients: Client })[]
}

export function AssignDialog({ programId, enrollments }: AssignDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('')
  const [assigneeName, setAssigneeName] = useState('')
  const [assigneeEmail, setAssigneeEmail] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const enrollment = enrollments.find(en => en.id === selectedEnrollment)
    if (!enrollment) {
      setError('Select an enrollment')
      setLoading(false)
      return
    }

    const result = await assignProgram(
      programId,
      enrollment.id,
      enrollment.client_id,
      assigneeName || enrollment.clients?.name || '',
      assigneeEmail || enrollment.clients?.email || ''
    )

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setIsOpen(false)
    setLoading(false)
    setSelectedEnrollment('')
    setAssigneeName('')
    setAssigneeEmail('')
    router.refresh()
  }

  const handleSelectEnrollment = (enrollmentId: string) => {
    setSelectedEnrollment(enrollmentId)
    const enrollment = enrollments.find(e => e.id === enrollmentId)
    if (enrollment?.clients) {
      setAssigneeName(enrollment.clients.name)
      setAssigneeEmail(enrollment.clients.email)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors text-sm"
      >
        <UserPlus className="w-4 h-4" />
        Assign to Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Assign Program</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Enrolled Company *</label>
                <select
                  value={selectedEnrollment}
                  onChange={e => handleSelectEnrollment(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                >
                  <option value="">Select enrollment...</option>
                  {enrollments.filter(e => e.status === 'active').map(e => (
                    <option key={e.id} value={e.id}>
                      {(e.clients as Client)?.company_name || (e.clients as Client)?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Assignee Name</label>
                <input
                  value={assigneeName}
                  onChange={e => setAssigneeName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Assignee Email</label>
                <input
                  type="email"
                  value={assigneeEmail}
                  onChange={e => setAssigneeEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="contact@company.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors">
                  {loading ? 'Assigning...' : 'Assign All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
