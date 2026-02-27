'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AddProgramButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: coach } = await supabase.from('coaches').select('parent_coach_id').eq('id', user.id).single()
    const coachId = coach?.parent_coach_id || user.id

    const { error } = await supabase.from('programs').insert({
      coach_id: coachId,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      duration_weeks: parseInt(formData.get('duration_weeks') as string) || 12,
      is_template: formData.get('is_template') === 'on',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setIsOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Program
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add New Program</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Program Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Leadership Accelerator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
                  placeholder="What does this program cover?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Duration (weeks)</label>
                <input
                  name="duration_weeks"
                  type="number"
                  min="1"
                  max="52"
                  defaultValue={12}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  name="is_template"
                  type="checkbox"
                  id="is_template"
                  className="w-4 h-4 rounded border-border-strong text-secondary focus:ring-secondary/40"
                />
                <label htmlFor="is_template" className="text-sm text-primary">Save as template</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
