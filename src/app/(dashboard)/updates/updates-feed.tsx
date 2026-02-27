'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Mic, FileText, MessageSquare, Tag, Trash2, Pencil, X, Check } from 'lucide-react'
import type { TelegramUpdate } from '@/types/database'
import { ExpandableText } from '@/components/ui/expandable-text'
import { deleteUpdate, updateUpdateContent } from './actions'

interface UpdatesFeedProps {
  updates: TelegramUpdate[]
  clients: { id: string; company_name: string }[]
}

const classificationColors: Record<string, string> = {
  progress: 'bg-emerald-50 text-emerald-700',
  blocker: 'bg-red-50 text-red-700',
  communication: 'bg-blue-50 text-blue-700',
  insight: 'bg-purple-50 text-purple-700',
  admin: 'bg-primary-5 text-muted',
}

const typeIcons: Record<string, typeof MessageSquare> = {
  text: MessageSquare,
  voice: Mic,
  document: FileText,
}

export function UpdatesFeed({ updates: initialUpdates, clients }: UpdatesFeedProps) {
  const [updates, setUpdates] = useState(initialUpdates)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.company_name]))

  const filtered = updates.filter(u => {
    if (filterClient !== 'all' && u.client_id !== filterClient) return false
    if (filterType !== 'all' && u.message_type !== filterType) return false
    return true
  })

  // Group by date
  const grouped: Record<string, TelegramUpdate[]> = {}
  for (const u of filtered) {
    const date = format(new Date(u.created_at), 'yyyy-MM-dd')
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(u)
  }

  const handleDelete = async (updateId: string) => {
    setUpdates(prev => prev.filter(u => u.id !== updateId))
    await deleteUpdate(updateId)
  }

  const handleEditStart = (update: TelegramUpdate) => {
    setEditingId(update.id)
    setEditContent(update.content)
  }

  const handleEditSave = async (updateId: string) => {
    if (!editContent.trim()) return
    setUpdates(prev => prev.map(u => u.id === updateId ? { ...u, content: editContent } : u))
    setEditingId(null)
    await updateUpdateContent(updateId, editContent)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditContent('')
  }

  // For voice messages, prefer voice_transcript over content
  const displayContent = (update: TelegramUpdate) => {
    if (update.message_type === 'voice' && update.voice_transcript) {
      return update.voice_transcript
    }
    return update.content
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          <option value="all">All Companies</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          <option value="all">All Types</option>
          <option value="text">Text</option>
          <option value="voice">Voice</option>
          <option value="document">Document</option>
        </select>
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dayUpdates]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-3">
              {dayUpdates.map((update) => {
                const Icon = typeIcons[update.message_type] || MessageSquare
                const company = update.client_id ? clientMap[update.client_id] : null
                const isEditing = editingId === update.id

                return (
                  <div key={update.id} className="bg-surface border border-border rounded-xl p-4 shadow-subtle group">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-lg bg-primary-5">
                        <Icon className="w-4 h-4 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {company && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-10 px-2 py-0.5 rounded-full">
                              <Tag className="w-3 h-3" />
                              {company}
                            </span>
                          )}
                          {update.classification && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classificationColors[update.classification] || 'bg-primary-5 text-muted'}`}>
                              {update.classification}
                            </span>
                          )}
                          <span className="text-xs text-muted ml-auto">
                            {format(new Date(update.created_at), 'h:mm a')}
                          </span>
                          {/* Edit/Delete buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isEditing && (
                              <>
                                <button
                                  onClick={() => handleEditStart(update)}
                                  className="p-1 text-muted hover:text-primary rounded transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(update.id)}
                                  className="p-1 text-muted hover:text-red-500 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="mt-1">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                              autoFocus
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleEditSave(update.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-secondary text-white text-xs font-medium rounded-lg hover:bg-secondary/90 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="flex items-center gap-1 px-3 py-1 bg-primary-5 text-primary text-xs font-medium rounded-lg hover:bg-primary-10 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ExpandableText text={displayContent(update)} lines={2} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-8">No updates match your filters</p>
      )}
    </div>
  )
}
