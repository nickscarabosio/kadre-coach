import { createClient } from '@/lib/supabase/server'
import { MessageList } from './message-list'
import { MessageSquare } from 'lucide-react'
import { NewMessageModal } from './new-message-modal'
import type { Message } from '@/types/database'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('id, company_name')
    .eq('coach_id', user.id)
    .order('company_name', { ascending: true }) : { data: null }

  // Get contacts with company names
  const clientIds = (clients || []).map(c => c.id)
  const { data: contacts } = clientIds.length > 0 ? await supabase
    .from('contacts')
    .select('id, name, client_id')
    .in('client_id', clientIds)
    .order('name') : { data: null }

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))
  const contactsWithCompany = (contacts || []).map(c => ({
    ...c,
    company_name: clientMap[c.client_id] || '',
  }))

  const { data: snippets } = user ? await supabase
    .from('coach_message_snippets')
    .select('id, title, body')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: true }) : { data: null }

  // Fetch conversations
  const { data: conversations } = user ? await supabase
    .from('conversations')
    .select('*')
    .eq('coach_id', user.id)
    .order('updated_at', { ascending: false }) : { data: null }

  // Fetch all messages with conversation_id
  const { data: messages } = user ? await supabase
    .from('messages')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  // Fetch conversation participants
  const conversationIds = (conversations || []).map(c => c.id)
  const { data: participants } = conversationIds.length > 0 ? await supabase
    .from('conversation_participants')
    .select('*')
    .in('conversation_id', conversationIds) : { data: null }

  // Group messages by conversation, plus legacy ungrouped
  const messagesByConversation: Record<string, Message[]> = {}
  const legacyMessagesByClient: Record<string, Message[]> = {}

  for (const msg of messages || []) {
    if (msg.conversation_id) {
      if (!messagesByConversation[msg.conversation_id]) messagesByConversation[msg.conversation_id] = []
      messagesByConversation[msg.conversation_id].push(msg)
    } else {
      if (!legacyMessagesByClient[msg.client_id]) legacyMessagesByClient[msg.client_id] = []
      legacyMessagesByClient[msg.client_id].push(msg)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Messages</h1>
          <p className="text-muted mt-1">Communicate with your companies and contacts</p>
        </div>
        <NewMessageModal
          contacts={contactsWithCompany}
          clients={(clients || []).map(c => ({ id: c.id, company_name: c.company_name }))}
          snippets={snippets ?? []}
        />
      </div>

      {(conversations && conversations.length > 0) || Object.keys(legacyMessagesByClient).length > 0 ? (
        <MessageList
          conversations={conversations || []}
          messagesByConversation={messagesByConversation}
          legacyMessagesByClient={legacyMessagesByClient}
          participants={participants || []}
          contacts={contactsWithCompany}
          clients={(clients || []).map(c => ({ id: c.id, company_name: c.company_name }))}
        />
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <MessageSquare className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No messages yet</h3>
          <p className="text-muted mb-4">Start a conversation with your contacts</p>
          <NewMessageModal
            contacts={contactsWithCompany}
            clients={(clients || []).map(c => ({ id: c.id, company_name: c.company_name }))}
            snippets={snippets ?? []}
          />
        </div>
      )}
    </div>
  )
}
