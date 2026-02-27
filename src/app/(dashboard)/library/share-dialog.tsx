'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Client, DocumentShare } from '@/types/database'
import { shareDocument, unshareDocument } from './actions'
import { useRouter } from 'next/navigation'

interface ShareDialogProps {
  documentId: string
  documentTitle: string
  clients: Client[]
  shares: DocumentShare[]
  onClose: () => void
}

export function ShareDialog({ documentId, documentTitle, clients, shares, onClose }: ShareDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const sharedClientIds = shares
    .filter(s => s.document_id === documentId)
    .map(s => s.client_id)

  const [selected, setSelected] = useState<Set<string>>(new Set(sharedClientIds))

  const handleToggle = (clientId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    // Determine which clients to add and remove
    const toAdd = [...selected].filter(id => !sharedClientIds.includes(id))
    const toRemove = sharedClientIds.filter(id => !selected.has(id))

    // Share with new clients
    if (toAdd.length > 0) {
      const result = await shareDocument(documentId, toAdd)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
    }

    // Unshare from removed clients
    for (const clientId of toRemove) {
      const result = await unshareDocument(documentId, clientId)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary">Share Document</h2>
            <p className="text-sm text-muted mt-0.5 truncate">{documentTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        {clients.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">No companies to share with.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
            {clients.map((client) => (
              <label
                key={client.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-5 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(client.id)}
                  onChange={() => handleToggle(client.id)}
                  className="w-4 h-4 rounded border-border-strong text-secondary focus:ring-secondary/40"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {client.company_name || client.name}
                  </p>
                  <p className="text-xs text-muted truncate">{client.name}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || clients.length === 0}
            className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
