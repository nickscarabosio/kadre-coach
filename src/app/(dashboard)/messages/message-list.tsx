'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { format } from 'date-fns'
import { Message, Conversation, ConversationParticipant } from '@/types/database'
import { sendMessageToConversation } from './actions'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  name: string
  client_id: string
  company_name: string
}

interface ClientOption {
  id: string
  company_name: string
}

interface MessageListProps {
  conversations: Conversation[]
  messagesByConversation: Record<string, Message[]>
  legacyMessagesByClient: Record<string, Message[]>
  participants: ConversationParticipant[]
  contacts: Contact[]
  clients: ClientOption[]
}

type ConversationItem = {
  type: 'conversation'
  id: string
  subject: string
  company_name: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
} | {
  type: 'legacy'
  clientId: string
  company_name: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export function MessageList({
  conversations,
  messagesByConversation,
  legacyMessagesByClient,
  participants,
  contacts,
  clients,
}: MessageListProps) {
  const router = useRouter()
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.company_name]))
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]))

  // Build conversation items
  const items: ConversationItem[] = []

  for (const conv of conversations) {
    const msgs = messagesByConversation[conv.id] || []
    const lastMsg = msgs[0]
    const unread = msgs.filter(m => !m.is_read).length
    const convParticipants = participants.filter(p => p.conversation_id === conv.id)
    const participantNames = convParticipants
      .filter(p => p.participant_type === 'contact' && p.contact_id)
      .map(p => contactMap[p.contact_id!]?.name || 'Unknown')
      .join(', ')

    items.push({
      type: 'conversation',
      id: conv.id,
      subject: conv.subject || participantNames || (conv.client_id ? clientMap[conv.client_id] || 'Unknown' : 'Conversation'),
      company_name: conv.client_id ? clientMap[conv.client_id] || null : null,
      lastMessage: lastMsg?.content || '',
      lastMessageAt: lastMsg?.created_at || conv.created_at,
      unreadCount: unread,
    })
  }

  // Legacy messages (no conversation)
  for (const [clientId, msgs] of Object.entries(legacyMessagesByClient)) {
    const lastMsg = msgs[0]
    const unread = msgs.filter(m => !m.is_read).length
    items.push({
      type: 'legacy',
      clientId,
      company_name: clientMap[clientId] || 'Unknown Company',
      lastMessage: lastMsg?.content || '',
      lastMessageAt: lastMsg?.created_at || '',
      unreadCount: unread,
    })
  }

  // Sort by last message time
  items.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  const [selectedItem, setSelectedItem] = useState<ConversationItem | null>(items[0] || null)

  const selectedMessages = selectedItem
    ? selectedItem.type === 'conversation'
      ? messagesByConversation[selectedItem.id] || []
      : legacyMessagesByClient[(selectedItem as { clientId: string }).clientId] || []
    : []

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedItem) return
    setSending(true)

    if (selectedItem.type === 'conversation') {
      await sendMessageToConversation(selectedItem.id, newMessage.trim())
    }
    // For legacy messages, we don't send through conversations

    setNewMessage('')
    setSending(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col md:flex-row bg-surface border border-border rounded-xl shadow-card overflow-hidden" style={{ minHeight: '400px', height: 'calc(100vh - 200px)' }}>
      {/* Conversation list - left on desktop, top on mobile */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0 max-h-[40vh] md:max-h-none">
        {items.map((item) => {
          const isSelected = selectedItem &&
            (item.type === 'conversation' && selectedItem.type === 'conversation' && item.id === selectedItem.id) ||
            (item.type === 'legacy' && selectedItem?.type === 'legacy' && (item as { clientId: string }).clientId === (selectedItem as { clientId: string }).clientId)
          const companyName = item.type === 'conversation' ? item.company_name : (item as { company_name: string }).company_name

          return (
            <button
              key={item.type === 'conversation' ? item.id : `legacy-${(item as { clientId: string }).clientId}`}
              onClick={() => setSelectedItem(item)}
              className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                isSelected ? 'bg-secondary-10' : 'hover:bg-primary-5'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-secondary' : 'text-primary'}`}>
                  {item.type === 'conversation' ? item.subject : (item as { company_name: string }).company_name}
                </p>
                {item.unreadCount > 0 && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-secondary text-white text-xs flex items-center justify-center shrink-0">
                    {item.unreadCount}
                  </span>
                )}
              </div>
              {companyName && (
                <p className="text-[10px] text-muted mt-0.5 font-medium">{companyName}</p>
              )}
              <p className="text-xs text-muted truncate mt-0.5">{item.lastMessage}</p>
              {item.lastMessageAt && (
                <p className="text-[10px] text-muted mt-0.5">
                  {format(new Date(item.lastMessageAt), 'MMM d, h:mm a')}
                </p>
              )}
            </button>
          )
        })}
        {items.length === 0 && (
          <p className="p-4 text-sm text-muted">No conversations yet</p>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-primary">
                {selectedItem.type === 'conversation' ? selectedItem.subject : (selectedItem as { company_name: string }).company_name}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedMessages.length > 0 ? (
                [...selectedMessages].reverse().map((msg) => {
                  const isCoach = msg.sender_type === 'coach' || !msg.sender_type
                  return (
                    <div key={msg.id} className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md rounded-lg p-3 ${
                        isCoach
                          ? 'bg-secondary-10 border border-secondary-20'
                          : 'bg-primary-5 border border-border'
                      }`}>
                        <p className="text-sm text-primary">{msg.content}</p>
                        <p className="text-xs text-muted mt-1">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted text-sm py-8">No messages yet. Start the conversation.</p>
              )}
            </div>

            {selectedItem.type === 'conversation' && (
              <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  )
}
