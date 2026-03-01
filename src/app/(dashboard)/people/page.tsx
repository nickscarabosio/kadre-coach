'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { Search, Users, Plus, X, Mail, MessageSquare, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import type { Contact, Client } from '@/types/database'
import { createConversation } from '@/app/(dashboard)/messages/actions'
import { toast } from 'sonner'

type ContactWithCompany = Contact & { company_name: string; client_id: string }

export default function PeoplePage() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [clients, setClients] = useState<Pick<Client, 'id' | 'company_name'>[]>([])
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // Quick message states
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<ContactWithCompany | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const coachId = await getCoachId(supabase)
    if (!coachId) return

    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('coach_id', coachId)

    if (!clientsData) return
    setClients(clientsData)

    const clientMap = Object.fromEntries(clientsData.map((c) => [c.id, c.company_name]))
    const clientIds = clientsData.map((c) => c.id)

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .in('client_id', clientIds)
      .order('name')

    if (contactsData) {
      setContacts(
        contactsData.map((c: Contact) => ({
          ...c,
          company_name: clientMap[c.client_id] || '',
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from('contacts').insert({
      client_id: fd.get('client_id') as string,
      name: fd.get('name') as string,
      email: (fd.get('email') as string) || null,
      phone: (fd.get('phone') as string) || null,
      role: (fd.get('role') as string) || null,
    })

    if (!error) {
      setShowAdd(false)
      load()
    }
    setSaving(false)
  }

  const handleQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageRecipient || !messageContent.trim()) return

    setSendingMessage(true)
    const res = await createConversation({
      subject: `Quick Message to ${messageRecipient.name}`,
      conversation_type: 'direct',
      participant_contact_ids: [messageRecipient.id],
      initial_message: messageContent,
      client_id: messageRecipient.client_id
    })

    setSendingMessage(false)
    if (res.success) {
      toast.success('Message sent')
      setShowMessageModal(false)
      setMessageContent('')
      setMessageRecipient(null)
    } else {
      toast.error(res.error || 'Failed to send message')
    }
  }

  const filtered = contacts.filter((c) => {
    if (companyFilter !== 'all' && c.client_id !== companyFilter) return false
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.role && c.role.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">People</h1>
          <p className="text-muted mt-1">{contacts.length} contacts across all companies</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search by name, company, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary"
        >
          <option value="all">All companies</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-primary-5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-primary-5">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-primary-5 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-10 flex items-center justify-center text-xs font-semibold text-secondary">
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-primary">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">{contact.role || '—'}</td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/clients/${contact.client_id}`}
                      className="text-sm text-secondary hover:text-secondary/80"
                    >
                      {contact.company_name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">
                    {contact.email ? (
                      <div className="flex items-center gap-2 group/email">
                        <span>{contact.email}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/email:opacity-100 transition-opacity">
                          <a
                            href={`mailto:${contact.email}`}
                            className="p-1 text-muted hover:text-secondary rounded-md hover:bg-secondary-10 transition-colors"
                            title="Send email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => { setMessageRecipient(contact); setShowMessageModal(true) }}
                            className="p-1 text-muted hover:text-secondary rounded-md hover:bg-secondary-10 transition-colors"
                            title="Send internal message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">
                    <div className="flex items-center justify-between gap-2 group/phone">
                      <span>{contact.phone || '—'}</span>
                      {contact.phone && (
                        <button
                          onClick={() => { setMessageRecipient(contact); setShowMessageModal(true) }}
                          className="p-1 text-muted hover:text-secondary rounded-md hover:bg-secondary-10 transition-colors opacity-0 group-hover/phone:opacity-100 transition-opacity"
                          title="Send internal message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <Users className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No contacts found</h3>
          <p className="text-muted">
            {search ? 'Try a different search term' : 'Add contacts to your companies to see them here'}
          </p>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add Contact</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Company *</label>
                <select
                  name="client_id"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="">Select company...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Role</label>
                <input
                  name="role"
                  type="text"
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="CEO, CTO, etc."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Message Modal */}
      {showMessageModal && messageRecipient && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Message {messageRecipient.name}</h2>
                <p className="text-xs text-muted">{messageRecipient.company_name}</p>
              </div>
              <button onClick={() => setShowMessageModal(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Message</label>
                <textarea
                  required
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="Type your message here..."
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !messageContent.trim()}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
