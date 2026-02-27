'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Mic, FileText, MessageSquare, Tag } from 'lucide-react'
import type { TelegramUpdate } from '@/types/database'
import { ExpandableText } from '@/components/ui/expandable-text'

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

export function UpdatesFeed({ updates, clients }: UpdatesFeedProps) {
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

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

                return (
                  <div key={update.id} className="bg-surface border border-border rounded-xl p-4 shadow-subtle">
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
                        </div>
                        <ExpandableText text={update.content} lines={2} />
                        {update.voice_transcript && update.voice_transcript !== update.content && (
                          <p className="text-xs text-muted mt-2 italic">Transcript: {update.voice_transcript}</p>
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
