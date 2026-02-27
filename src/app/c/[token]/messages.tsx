'use client'

import { Message } from '@/types/database'
import { format } from 'date-fns'

export function PortalMessages({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return <p className="text-muted text-center py-8">No messages from your coach yet.</p>
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="bg-secondary-10 border border-secondary-20 rounded-lg p-4">
          <p className="text-primary/80 text-sm">{msg.content}</p>
          <p className="text-xs text-muted mt-2">
            {format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      ))}
    </div>
  )
}
