'use client'

import { format } from 'date-fns'
import { Mic, FileText, MessageSquare, Tag, Pencil, Trash2 } from 'lucide-react'
import type { TelegramUpdate } from '@/types/database'
import { SlideOver } from '@/components/ui/slide-over'

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

interface UpdateDetailPanelProps {
  update: TelegramUpdate
  companyName: string | null
  open: boolean
  onClose: () => void
  onEdit: (update: TelegramUpdate) => void
  onDelete: (updateId: string) => void
}

export function UpdateDetailPanel({ update, companyName, open, onClose, onEdit, onDelete }: UpdateDetailPanelProps) {
  const Icon = typeIcons[update.message_type] || MessageSquare
  const displayContent = update.message_type === 'voice' && update.voice_transcript
    ? update.voice_transcript
    : update.content

  return (
    <SlideOver open={open} onClose={onClose} title="Update Details" width="max-w-lg">
      <div className="space-y-6">
        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-2 rounded-lg bg-primary-5">
            <Icon className="w-4 h-4 text-muted" />
          </div>
          {companyName && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-10 px-2 py-0.5 rounded-full">
              <Tag className="w-3 h-3" />
              {companyName}
            </span>
          )}
          {update.classification && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classificationColors[update.classification] || 'bg-primary-5 text-muted'}`}>
              {update.classification}
            </span>
          )}
          <span className="text-xs text-muted ml-auto">
            {format(new Date(update.created_at), 'EEEE, MMMM d, yyyy · h:mm a')}
          </span>
        </div>

        {/* Content */}
        <div>
          <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">{displayContent}</p>
        </div>

        {/* Voice transcript if different from content */}
        {update.message_type === 'voice' && update.voice_transcript && update.voice_transcript !== update.content && (
          <div>
            <p className="text-xs text-muted uppercase font-medium mb-1">Original message</p>
            <p className="text-sm text-primary/70 whitespace-pre-wrap">{update.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={() => { onEdit(update); onClose() }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-5 hover:bg-primary-10 text-primary text-sm font-medium rounded-lg border border-border transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => { onDelete(update.id); onClose() }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg border border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </SlideOver>
  )
}
