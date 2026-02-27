'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Mail, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { DailySynthesis } from '@/types/database'

interface SynthesisListProps {
  syntheses: DailySynthesis[]
}

export function SynthesisList({ syntheses }: SynthesisListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(syntheses[0]?.id || null)

  return (
    <div className="space-y-3">
      {syntheses.map((synthesis) => {
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
                <div className="flex gap-1.5">
                  {synthesis.sent_email && (
                    <span className="p-1 rounded bg-emerald-50" title="Email sent">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  )}
                  {synthesis.sent_telegram && (
                    <span className="p-1 rounded bg-blue-50" title="Sent via Telegram">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                    </span>
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
                <div className="pt-4 prose prose-sm max-w-none prose-headings:text-primary prose-p:text-primary/80 prose-li:text-primary/80 prose-strong:text-primary">
                  <ReactMarkdown>
                    {synthesis.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
