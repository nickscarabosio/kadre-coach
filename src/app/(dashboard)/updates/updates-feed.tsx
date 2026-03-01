'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Mic, FileText, MessageSquare, Tag, Trash2, Pencil, X, Check, Plus, Flag, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import type { TelegramUpdate } from '@/types/database'
import { ExpandableText } from '@/components/ui/expandable-text'
import { deleteUpdate, updateUpdateContent, logUpdate, updateUpdateMetadata, type UpdateClassification } from './actions'
import { UpdateDetailPanel } from './update-detail-panel'
import { toast } from 'sonner'

interface UpdatesFeedProps {
  updates: TelegramUpdate[]
  clients: { id: string; company_name: string }[]
  coaches: { id: string; full_name: string }[]
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

const UPDATE_TYPES: { value: UpdateClassification; label: string }[] = [
  { value: 'communication', label: 'Communication' },
  { value: 'insight', label: 'Insight' },
  { value: 'admin', label: 'Admin' },
  { value: 'progress', label: 'Progress' },
  { value: 'blocker', label: 'Blocker' },
]

export function UpdatesFeed({ updates: initialUpdates, clients, coaches }: UpdatesFeedProps) {
  const [updates, setUpdates] = useState(initialUpdates)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterClassification, setFilterClassification] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [detailUpdate, setDetailUpdate] = useState<TelegramUpdate | null>(null)

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.company_name]))

  const filtered = updates.filter(u => {
    if (filterClient !== 'all' && u.client_id !== filterClient) return false
    if (filterType !== 'all' && u.message_type !== filterType) return false
    if (filterClassification !== 'all' && u.classification !== filterClassification) return false
    if (keyword.trim()) {
      const q = keyword.toLowerCase()
      const text = ((u.content || '') + ' ' + (u.voice_transcript || '')).toLowerCase()
      if (!text.includes(q)) return false
    }
    if (dateFrom) {
      const d = format(new Date(u.created_at), 'yyyy-MM-dd')
      if (d < dateFrom) return false
    }
    if (dateTo) {
      const d = format(new Date(u.created_at), 'yyyy-MM-dd')
      if (d > dateTo) return false
    }
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
    toast.success('Update deleted')
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
    toast.success('Update saved')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleToggleFlag = async (update: TelegramUpdate) => {
    const currentMeta = (update.action_items as any) || {}
    const isFlagged = currentMeta.flagged === true
    const newMeta = { ...currentMeta, flagged: !isFlagged }

    setUpdates(prev => prev.map(u => u.id === update.id ? { ...u, action_items: newMeta } : u))
    await updateUpdateMetadata(update.id, { flagged: !isFlagged })
    toast.success(!isFlagged ? 'Update flagged' : 'Flag removed')
  }

  // For voice messages, prefer voice_transcript over content
  const displayContent = (update: TelegramUpdate) => {
    if (update.message_type === 'voice' && update.voice_transcript) {
      return update.voice_transcript
    }
    return update.content
  }

  // First two sentences for scannable preview
  const firstTwoSentences = (text: string) => {
    if (!text || !text.trim()) return ''
    const trimmed = text.trim()
    const parts = trimmed.split(/(?<=[.!?])\s+/)
    if (parts.length >= 2) return (parts[0] + ' ' + parts[1]).trim()
    if (parts.length === 1 && parts[0]) return parts[0].trim()
    return trimmed.slice(0, 200)
  }

  const handleLogUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLogError(null)
    setLogLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await logUpdate({
      client_id: formData.get('client_id') as string,
      content: formData.get('content') as string,
      classification: formData.get('classification') as UpdateClassification,
    })
    setLogLoading(false)
    if (res?.error) {
      setLogError(res.error)
      return
    }
    setShowLogModal(false)
    form.reset()
    toast.success('Update logged')
    window.location.reload()
  }

  return (
    <div>
      {/* Log Update + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90"
        >
          <Plus className="w-4 h-4" />
          Log Update
        </button>
        <input
          type="text"
          placeholder="Search by keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 min-w-[180px]"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          title="To date"
        />
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
        <select
          value={filterClassification}
          onChange={(e) => setFilterClassification(e.target.value)}
          className="px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          <option value="all">All Tags</option>
          {UPDATE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Log Update Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-nav">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">Log Update</h3>
              <button type="button" onClick={() => setShowLogModal(false)} className="p-2 rounded-lg text-muted hover:bg-primary-5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogUpdate} className="p-4 space-y-4">
              {logError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{logError}</p>}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Company</label>
                <select name="client_id" required className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary">
                  <option value="">Select company</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Type</label>
                <select name="classification" required className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary">
                  {UPDATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">Communication, Insight, Admin, Progress, Blocker</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Update</label>
                <textarea name="content" required rows={4} placeholder="What happened?" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary placeholder-muted resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 rounded-lg border border-border text-primary hover:bg-primary-5">Cancel</button>
                <button type="submit" disabled={logLoading} className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-secondary/90 disabled:opacity-50">{logLoading ? 'Saving\u2026' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                const isFlagged = (update.action_items as any)?.flagged === true

                return (
                  <div key={update.id} className={`bg-surface border border-border rounded-xl p-4 shadow-subtle group cursor-pointer hover:bg-primary-5/50 transition-colors ${isFlagged ? 'ring-2 ring-amber-500/20 border-amber-200' : ''}`} onClick={() => setDetailUpdate(update)}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-lg bg-primary-5">
                        <Icon className="w-4 h-4 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div>
                            {/* ... existing editing UI ... */}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-1.5">
                              <p className="text-sm text-primary font-medium leading-snug whitespace-pre-wrap">
                                {(() => {
                                  const content = displayContent(update)
                                  const preview = firstTwoSentences(content) || content.slice(0, 120)
                                  return preview + (content.length > preview.length ? '\u2026' : '')
                                })()}
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleFlag(update) }}
                                className={`p-1 rounded-md transition-colors ${isFlagged ? 'text-amber-500 bg-amber-50' : 'text-muted hover:text-amber-500 hover:bg-amber-50'}`}
                                title={isFlagged ? 'Remove flag' : 'Flag as important'}
                              >
                                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {company && update.client_id && (
                                <Link
                                  href={`/clients/${update.client_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-10 px-2 py-0.5 rounded-full hover:bg-secondary-20 transition-colors"
                                >
                                  <Tag className="w-3 h-3" />
                                  {company}
                                </Link>
                              )}
                              {update.classification && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classificationColors[update.classification] || 'bg-primary-5 text-muted'}`}>
                                  {update.classification}
                                </span>
                              )}
                              <span className="text-xs text-muted">
                                {format(new Date(update.created_at), 'h:mm a')}
                              </span>
                              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-auto">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditStart(update) }}
                                  className="p-1 text-muted hover:text-primary rounded transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(update.id) }}
                                  className="p-1 text-muted hover:text-red-500 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {(() => {
                              const content = displayContent(update)
                              const preview = firstTwoSentences(content) || content.slice(0, 120)
                              const hasMore = content.length > preview.length
                              const isExpanded = expandedContentId === update.id
                              if (!hasMore) return null
                              return (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedContentId(isExpanded ? null : update.id) }}
                                    className="text-xs text-secondary hover:text-secondary/80 font-medium"
                                  >
                                    {isExpanded ? 'Show less' : 'View more'}
                                  </button>
                                  {isExpanded && (
                                    <p className="text-sm text-primary/80 whitespace-pre-wrap mt-1">{content}</p>
                                  )}
                                </div>
                              )
                            })()}
                          </>
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

      {detailUpdate && (
        <UpdateDetailPanel
          update={detailUpdate}
          companyName={detailUpdate.client_id ? clientMap[detailUpdate.client_id] : null}
          coaches={coaches}
          open={!!detailUpdate}
          onClose={() => setDetailUpdate(null)}
          onEdit={(u) => { handleEditStart(u) }}
          onDelete={(id) => { handleDelete(id) }}
          onUpdateMetadata={async (id, meta) => {
            setUpdates(prev => prev.map(u => u.id === id ? { ...u, action_items: { ...(u.action_items as any || {}), ...meta } } : u))
            await updateUpdateMetadata(id, meta)
          }}
        />
      )}
    </div>
  )
}
