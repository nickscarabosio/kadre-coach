'use client'

import { useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { createConversation } from './actions'
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

interface NewMessageModalProps {
  contacts: Contact[]
  clients: ClientOption[]
}

type RecipientType = 'individual' | 'company' | 'coach'

export function NewMessageModal({ contacts, clients }: NewMessageModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [recipientType, setRecipientType] = useState<RecipientType>('individual')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleCompanySelect = (clientId: string) => {
    setSelectedCompany(clientId)
    // Auto-select all contacts for this company
    const companyContacts = contacts.filter(c => c.client_id === clientId).map(c => c.id)
    setSelectedContacts(companyContacts)
  }

  const handleSend = async () => {
    if (!message.trim() || selectedContacts.length === 0) return
    setSending(true)

    const clientId = selectedCompany || (selectedContacts.length > 0
      ? contacts.find(c => c.id === selectedContacts[0])?.client_id
      : null)

    await createConversation({
      subject: subject || 'New conversation',
      conversation_type: recipientType === 'company' ? 'company' : recipientType === 'coach' ? 'coach' : 'direct',
      client_id: clientId || null,
      participant_contact_ids: selectedContacts,
      initial_message: message,
    })

    setIsOpen(false)
    setMessage('')
    setSubject('')
    setSelectedContacts([])
    setSelectedCompany('')
    setSending(false)
    router.refresh()
  }

  const tabs: { label: string; value: RecipientType }[] = [
    { label: 'Individual', value: 'individual' },
    { label: 'Company-wide', value: 'company' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        New Message
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-6 mx-4 shadow-nav max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary">New Message</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Type Tabs */}
            <div className="flex items-center gap-1 bg-primary-5 rounded-lg p-1 mb-4">
              {tabs.map(t => (
                <button
                  key={t.value}
                  onClick={() => {
                    setRecipientType(t.value)
                    setSelectedContacts([])
                    setSelectedCompany('')
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    recipientType === t.value ? 'bg-surface text-primary shadow-sm' : 'text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {recipientType === 'individual' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredContacts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedContacts.includes(c.id)
                            ? 'bg-secondary-10 text-secondary'
                            : 'hover:bg-primary-5 text-primary'
                        }`}
                      >
                        {c.name} <span className="text-muted">({c.company_name})</span>
                      </button>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="text-sm text-muted px-3 py-2">No contacts found</p>
                    )}
                  </div>
                </>
              )}

              {recipientType === 'company' && (
                <div>
                  <select
                    value={selectedCompany}
                    onChange={(e) => handleCompanySelect(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  >
                    <option value="">Select a company</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                  {selectedContacts.length > 0 && (
                    <p className="text-xs text-muted mt-2">{selectedContacts.length} recipients selected</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Conversation subject"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim() || selectedContacts.length === 0}
                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
