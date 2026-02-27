'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Client } from '@/types/database'
import { createResource } from './actions'
import { useRouter } from 'next/navigation'

export function UploadResource({ clients }: { clients: Client[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resourceType, setResourceType] = useState<'link' | 'file'>('link')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('type', resourceType === 'file' ? 'document' : 'link')

    const result = await createResource(formData)

    if (result.error) {
      setError(result.error)
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
        Add Resource
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add Resource</h2>
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResourceType('link')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    resourceType === 'link' ? 'bg-secondary text-white' : 'bg-primary-5 text-muted'
                  }`}
                >
                  URL Link
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('file')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    resourceType === 'file' ? 'bg-secondary text-white' : 'bg-primary-5 text-muted'
                  }`}
                >
                  File Upload
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Resource name"
                />
              </div>

              {resourceType === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">URL *</label>
                  <input
                    name="url"
                    type="url"
                    required
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">File *</label>
                  <input
                    name="file"
                    type="file"
                    required
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-10 file:text-secondary"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Company (optional)</label>
                <select
                  name="client_id"
                  defaultValue=""
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                >
                  <option value="">Shared (all companies)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                  ))}
                </select>
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
                  {loading ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
