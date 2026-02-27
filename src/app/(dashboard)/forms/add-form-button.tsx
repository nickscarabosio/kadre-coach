'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createForm } from './actions'
import { useRouter } from 'next/navigation'

export function AddFormButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createForm(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setIsOpen(false)
    setLoading(false)
    if (result.id) {
      router.push(`/forms/${result.id}`)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors">
        <Plus className="w-5 h-5" />
        Add Form
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Create New Form</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Form Title *</label>
                <input name="title" type="text" required className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" placeholder="Client Intake Form" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                <textarea name="description" rows={3} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none" placeholder="What is this form for?" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors">{loading ? 'Creating...' : 'Create Form'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
