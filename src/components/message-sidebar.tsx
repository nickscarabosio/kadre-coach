'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Send, User, Building2, Plus, ArrowRight, Loader2, X } from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
import { createClient } from '@/lib/supabase/client'
import { sendMessageToConversation, createConversation } from '@/app/(dashboard)/messages/actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface MessageSidebarProps {
  open: boolean
  onClose: () => void
}

interface ConversationItem {
  id: string
  subject: string | null
  conversation_type: string
  updated_at: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  client_name?: string
}

export function MessageSidebar({ open, onClose }: MessageSidebarProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [composeTo, setComposeTo] = useState<'contact' | 'coach'>('contact')
  const [selectedRecipient, setSelectedRecipient] = useState<string>('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([])
  const [contacts, setContacts] = useState<{ id: string; name: string; client_id: string }[]>([])
  const [coaches, setCoaches] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    if (open) {
      loadConversations()
      loadRecipients()
    }
  }, [open])

  async function loadConversations() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get conversations where the coach is a participant
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('coach_id', user.id)

    if (!participants || participants.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const convIds = participants.map(p => p.conversation_id)

    const { data: convs, error } = await supabase
      .from('conversations')
      .select(`
        id,
        subject,
        conversation_type,
        updated_at,
        client_id,
        clients (company_name),
        messages (content, created_at, is_read, sender_coach_id)
      `)
      .in('id', convIds)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (convs) {
      setConversations(convs.map(c => {
        const lastMsg = (c.messages as any[])?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        
        const unreadCount = (c.messages as any[])?.filter(m => 
          !m.is_read && m.sender_coach_id !== user.id
        ).length || 0

        return {
          id: c.id,
          subject: c.subject,
          conversation_type: c.conversation_type,
          updated_at: c.updated_at,
          last_message: lastMsg?.content,
          last_message_at: lastMsg?.created_at,
          unread_count: unreadCount,
          client_name: (c.clients as any)?.company_name
        }
      }))
    }
    setLoading(false)
  }

  async function loadRecipients() {
    const supabase = createClient()
    const [clientsRes, contactsRes, coachesRes] = await Promise.all([
      supabase.from('clients').select('id, company_name').order('company_name'),
      supabase.from('contacts').select('id, name, client_id').order('name'),
      supabase.from('coaches').select('id, full_name').order('full_name')
    ])

    if (clientsRes.data) setClients(clientsRes.data)
    if (contactsRes.data) setContacts(contactsRes.data)
    if (coachesRes.data) setCoaches(coachesRes.data)
  }

  async function handleCompose(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRecipient || !composeMessage.trim()) return
    
    setSending(true)
    const res = await createConversation({
      subject: composeSubject || 'Quick Message',
      conversation_type: composeTo === 'coach' ? 'coach' : 'direct',
      participant_contact_ids: composeTo === 'contact' ? [selectedRecipient] : [],
      participant_coach_ids: composeTo === 'coach' ? [selectedRecipient] : [],
      initial_message: composeMessage,
    })

    setSending(false)
    if (res.success) {
      toast.success('Message sent')
      setShowCompose(false)
      setComposeMessage('')
      setComposeSubject('')
      setSelectedRecipient('')
      loadConversations()
    } else {
      toast.error(res.error || 'Failed to send message')
    }
  }

  return (
    <SlideOver open={open} onClose={onClose} title="Messages" width="max-w-md">
      <div className="flex flex-col h-full -mx-6 -my-4">
        {/* Quick Compose Toggle */}
        <div className="p-4 border-b border-border bg-primary-5/30">
          {!showCompose ? (
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Compose New Message
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-primary">New Message</h4>
                <button onClick={() => setShowCompose(false)} className="text-muted hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCompose} className="space-y-3">
                <div className="flex gap-2 p-1 bg-surface border border-border rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setComposeTo('contact'); setSelectedRecipient('') }}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${composeTo === 'contact' ? 'bg-secondary text-white' : 'hover:bg-primary-5 text-muted'}`}
                  >
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => { setComposeTo('coach'); setSelectedRecipient('') }}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${composeTo === 'coach' ? 'bg-secondary text-white' : 'hover:bg-primary-5 text-muted'}`}
                  >
                    Coach
                  </button>
                </div>

                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="">Select {composeTo === 'contact' ? 'contact' : 'coach'}...</option>
                  {composeTo === 'contact' 
                    ? contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({clients.find(cl => cl.id === c.client_id)?.company_name})</option>
                      ))
                    : coaches.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))
                  }
                </select>

                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />

                <textarea
                  placeholder="Write your message..."
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                />

                <button
                  type="submit"
                  disabled={sending || !selectedRecipient || !composeMessage.trim()}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Message
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/messages?id=${conv.id}`}
                  onClick={onClose}
                  className="flex flex-col gap-1 p-4 hover:bg-primary-5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-primary truncate max-w-[200px]">
                      {conv.subject || 'Untitled Conversation'}
                    </h5>
                    {conv.unread_count > 0 && (
                      <span className="px-1.5 py-0.5 bg-secondary text-white text-[10px] font-bold rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                    {!conv.unread_count && conv.last_message_at && (
                      <span className="text-[10px] text-muted">
                        {format(new Date(conv.last_message_at), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                    {conv.conversation_type === 'direct' ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    <span>{conv.client_name || (conv.conversation_type === 'coach' ? 'Coaches' : 'Direct')}</span>
                  </div>
                  <p className="text-xs text-muted line-clamp-1 italic">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 p-6 text-center text-muted">
              <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No recent messages</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface sticky bottom-0">
          <Link
            href="/messages"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-border text-primary text-sm font-medium rounded-lg hover:bg-primary-5 transition-colors"
          >
            View All Messages
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </SlideOver>
  )
}
