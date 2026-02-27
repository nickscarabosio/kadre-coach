'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { CoachMessageSnippet } from '@/types/database'
import { createSnippet, updateSnippet, deleteSnippet } from './actions'
import { useRouter } from 'next/navigation'

interface MessageSnippetsProps {
  snippets: CoachMessageSnippet[]
}

export function MessageSnippets({ snippets: initialSnippets }: MessageSnippetsProps) {
  const router = useRouter()
  const [snippets, setSnippets] = useState(initialSnippets)

  useEffect(() => {
    setSnippets(initialSnippets)
  }, [initialSnippets])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const startEdit = (s: CoachMessageSnippet) => {
    setEditingId(s.id)
    setEditTitle(s.title)
    setEditBody(s.body)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditBody('')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editBody.trim()) return
    const formData = new FormData()
    formData.set('title', editTitle)
    formData.set('body', editBody)
    const result = await updateSnippet(editingId, formData)
    if (result.error) {
      setMessage(result.error)
    } else {
      setSnippets(prev => prev.map(s => s.id === editingId ? { ...s, title: editTitle, body: editBody } : s))
      setEditingId(null)
      setEditTitle('')
      setEditBody('')
      setMessage(null)
      router.refresh()
    }
  }

  const handleAdd = async () => {
    if (!newTitle.trim() || !newBody.trim()) return
    const formData = new FormData()
    formData.set('title', newTitle)
    formData.set('body', newBody)
    const result = await createSnippet(formData)
    if (result.error) {
      setMessage(result.error)
    } else {
      setAdding(false)
      setNewTitle('')
      setNewBody('')
      setMessage(null)
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this snippet?')) return
    const result = await deleteSnippet(id)
    if (result.error) {
      setMessage(result.error)
    } else {
      setSnippets(prev => prev.filter(s => s.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Save reusable message snippets to insert when composing messages.</p>
      {message && (
        <p className="text-sm text-red-600">{message}</p>
      )}
      <div className="space-y-3">
        {snippets.map((s) => (
          <div
            key={s.id}
            className="border border-border rounded-lg p-4 bg-primary-5/30"
          >
            {editingId === s.id ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                  placeholder="Title"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                  placeholder="Body"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-secondary text-white text-sm rounded-lg hover:bg-secondary/90"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 bg-surface border border-border text-sm rounded-lg hover:bg-primary-5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-primary">{s.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="p-1.5 text-muted hover:text-primary rounded"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-muted hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted mt-1 whitespace-pre-wrap line-clamp-2">{s.body}</p>
              </>
            )}
          </div>
        ))}
      </div>
      {adding ? (
        <div className="border border-border rounded-lg p-4 bg-primary-5/30 space-y-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
            placeholder="Snippet title"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
            placeholder="Snippet body"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newBody.trim()}
              className="px-3 py-1.5 bg-secondary text-white text-sm rounded-lg hover:bg-secondary/90 disabled:opacity-50"
            >
              Add snippet
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewTitle(''); setNewBody(''); }}
              className="px-3 py-1.5 bg-surface border border-border text-sm rounded-lg hover:bg-primary-5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-5 hover:bg-primary-10 border border-border rounded-lg text-sm font-medium text-primary"
        >
          <Plus className="w-4 h-4" />
          Add snippet
        </button>
      )}
    </div>
  )
}
