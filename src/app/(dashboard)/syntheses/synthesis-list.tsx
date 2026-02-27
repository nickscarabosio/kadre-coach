'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Mail, Send, Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { DailySynthesis } from '@/types/database'
import { cleanMarkdownForDisplay } from '@/lib/markdown-clean'
import { sendSynthesisByEmail } from './actions'

interface SynthesisListProps {
  syntheses: DailySynthesis[]
}

export function SynthesisList({ syntheses }: SynthesisListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(syntheses[0]?.id || null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(
    () => new Set(syntheses.filter(s => s.sent_email).map(s => s.id))
  )

  const filtered = useMemo(() => {
    let list = syntheses
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter((s) => {
        const dateStr = format(new Date(s.synthesis_date + 'T12:00:00'), 'yyyy-MM-dd EEEE MMMM')
        const content = (s.summary || s.content || '').toLowerCase()
        return dateStr.toLowerCase().includes(q) || content.includes(q)
      })
    }
    if (dateFrom) {
      list = list.filter((s) => s.synthesis_date >= dateFrom)
    }
    if (dateTo) {
      list = list.filter((s) => s.synthesis_date <= dateTo)
    }
    return list
  }, [syntheses, search, dateFrom, dateTo])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search syntheses by date or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          title="To date"
        />
      </div>
      <div className="space-y-3">
      {filtered.map((synthesis) => {
        const isExpanded = expandedId === synthesis.id

        return (
          <div key={synthesis.id} className="bg-surface border border-border rounded-xl shadow-subtle overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : synthesis.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-primary-5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {format(new Date(synthesis.synthesis_date + 'T12:00:00'), 'd')}
                  </p>
                  <p className="text-xs text-muted uppercase">
                    {format(new Date(synthesis.synthesis_date + 'T12:00:00'), 'MMM')}
                  </p>
                </div>
                <div>
                  <p className="text-primary font-medium">
                    {format(new Date(synthesis.synthesis_date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted line-clamp-3">
                    {synthesis.summary || synthesis.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 items-center">
                  {sentIds.has(synthesis.id) ? (
                    <span className="p-1 rounded bg-emerald-50" title="Email sent">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSendingId(synthesis.id)
                        const result = await sendSynthesisByEmail(synthesis.id)
                        setSendingId(null)
                        if (result.success) setSentIds(prev => new Set(prev).add(synthesis.id))
                      }}
                      disabled={sendingId !== null}
                      className="p-1.5 rounded bg-primary-5 hover:bg-primary-10 text-muted hover:text-primary disabled:opacity-50"
                      title="Send by email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {synthesis.sent_telegram && (
                    <span className="p-1 rounded bg-blue-50" title="Sent via Telegram">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                    </span>
                  )}
                  {sendingId === synthesis.id && (
                    <span className="text-xs text-muted">Sending…</span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border">
                {synthesis.content ? (
                  <div className="pt-4 prose prose-sm max-w-none prose-headings:text-primary prose-p:text-primary/80 prose-li:text-primary/80 prose-strong:text-primary">
                    <ReactMarkdown>
                      {cleanMarkdownForDisplay(synthesis.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="pt-4 text-muted text-sm">Synthesis unavailable for this date. Please try regenerating.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}
