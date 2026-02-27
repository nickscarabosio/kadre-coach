'use client'

import { useState } from 'react'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'
import type { Contact } from '@/types/database'
import { createContact, updateContact, deleteContact } from './contact-actions'

interface TeamContactsProps {
  clientId: string
  contacts: Contact[]
}

export function TeamContacts({ clientId, contacts: initialContacts }: TeamContactsProps) {
  const [contacts, setContacts] = useState(initialContacts)
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const data = {
      name: fd.get('name') as string,
      email: (fd.get('email') as string) || null,
      phone: (fd.get('phone') as string) || null,
      role: (fd.get('role') as string) || null,
      is_primary: fd.get('is_primary') === 'on',
    }
    const result = await createContact(clientId, data)
    if (!result.error) {
      const optimistic: Contact = {
        id: crypto.randomUUID(),
        client_id: clientId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role || null,
        is_primary: data.is_primary || false,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setContacts(prev => [...prev, optimistic])
    }
    setShowModal(false)
    setSaving(false)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingContact) return
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const data = {
      name: fd.get('name') as string,
      email: (fd.get('email') as string) || null,
      phone: (fd.get('phone') as string) || null,
      role: (fd.get('role') as string) || null,
      is_primary: fd.get('is_primary') === 'on',
    }
    const result = await updateContact(editingContact.id, clientId, data)
    if (!result.error) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...data } : c))
    }
    setEditingContact(null)
    setSaving(false)
  }

  const handleDelete = async (contact: Contact) => {
    setContacts(prev => prev.filter(c => c.id !== contact.id))
    await deleteContact(contact.id, clientId)
  }

  const openAdd = () => {
    setEditingContact(null)
    setShowModal(true)
  }

  const openEdit = (contact: Contact) => {
    setEditingContact(contact)
    setShowModal(true)
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Team Contacts</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/90 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Contact
          </button>
        </div>
        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 p-3 bg-primary-5 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-semibold text-primary">
                  {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {contact.name}
                    {contact.is_primary && <span className="ml-1.5 text-xs text-secondary">(Primary)</span>}
                  </p>
                  <p className="text-xs text-muted truncate">{contact.role || contact.email || '—'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(contact)} className="p-1 text-muted hover:text-primary rounded">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(contact)} className="p-1 text-muted hover:text-red-500 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm text-center py-4">No contacts yet. Add your first team member.</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingContact(null) }} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingContact ? handleEdit : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingContact?.name || ''}
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
                    defaultValue={editingContact?.email || ''}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingContact?.phone || ''}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    placeholder="+1 555-0100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Role</label>
                <input
                  name="role"
                  type="text"
                  defaultValue={editingContact?.role || ''}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="CEO, CTO, etc."
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="is_primary"
                  type="checkbox"
                  defaultChecked={editingContact?.is_primary || false}
                  className="rounded border-border-strong"
                />
                <span className="text-primary font-medium">Primary contact</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingContact(null) }}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : editingContact ? 'Save' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
