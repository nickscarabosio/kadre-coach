'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Client } from '@/types/database'
import { createDocument } from './actions'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(
  () => import('./rich-text-editor').then(mod => ({ default: mod.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-[200px] border border-border-strong rounded-lg animate-pulse bg-primary-5" /> }
)

export function UploadDialog({ clients }: { clients: Client[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [docType, setDocType] = useState<'link' | 'file' | 'richtext'>('link')
  const [richContent, setRichContent] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('document_type', docType)

    if (docType === 'richtext') {
      formData.set('content', richContent)
    }

    const result = await createDocument(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setIsOpen(false)
    setLoading(false)
    setDocType('link')
    setRichContent('')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Document
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add Document</h2>
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
                  onClick={() => setDocType('link')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    docType === 'link' ? 'bg-secondary text-white' : 'bg-primary-5 text-muted'
                  }`}
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('file')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    docType === 'file' ? 'bg-secondary text-white' : 'bg-primary-5 text-muted'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('richtext')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    docType === 'richtext' ? 'bg-secondary text-white' : 'bg-primary-5 text-muted'
                  }`}
                >
                  Write
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Document title"
                />
              </div>

              {docType === 'link' && (
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
              )}

              {docType === 'file' && (
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

              {docType === 'richtext' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                  <input
                    name="description"
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary mb-3"
                    placeholder="Brief description (optional)"
                  />
                  <label className="block text-sm font-medium text-primary mb-1.5">Content *</label>
                  <RichTextEditor
                    content={richContent}
                    onChange={setRichContent}
                    placeholder="Start writing..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Category</label>
                <select
                  name="category"
                  defaultValue="general"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                >
                  <option value="general">General</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="resources">Resources</option>
                  <option value="templates">Templates</option>
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
                  {loading ? 'Adding...' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
