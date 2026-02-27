'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building,
  Mail,
  Globe,
  Pencil,
  X,
} from 'lucide-react'
import type { Client } from '@/types/database'
import { updateClient } from './actions'

interface ClientHeaderProps {
  client: Client
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-primary-5 text-muted border-border',
  completed: 'bg-secondary-10 text-secondary border-secondary-20',
}

export function ClientHeader({ client: initialClient }: ClientHeaderProps) {
  const [client, setClient] = useState(initialClient)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company_name: client.company_name || '',
    email: client.email,
    industry: client.industry || '',
    website: client.website || '',
    status: client.status,
  })

  const handleSave = async () => {
    setSaving(true)
    const result = await updateClient(client.id, {
      company_name: form.company_name,
      email: form.email,
      industry: form.industry || null,
      website: form.website || null,
      status: form.status,
    })
    if (!result.error) {
      setClient(prev => ({
        ...prev,
        company_name: form.company_name,
        email: form.email,
        industry: form.industry || null,
        website: form.website || null,
        status: form.status,
      }))
      setEditing(false)
    }
    setSaving(false)
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-muted hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>

        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-xl bg-primary-5 flex items-center justify-center">
            <Building className="w-10 h-10 text-primary/60" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-primary">{client.company_name || client.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[client.status] || statusColors.active}`}>
                {client.status === 'at_risk' ? 'At Risk' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
              <button
                onClick={() => {
                  setForm({
                    company_name: client.company_name || '',
                    email: client.email,
                    industry: client.industry || '',
                    website: client.website || '',
                    status: client.status,
                  })
                  setEditing(true)
                }}
                className="p-1.5 text-muted hover:text-primary hover:bg-primary-5 rounded-lg transition-colors"
                title="Edit company"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-muted">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {client.email}
              </span>
              {client.industry && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-primary border border-border">
                  {client.industry}
                </span>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-secondary hover:text-secondary/80">
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted mb-1">Engagement Score</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-3 bg-primary-5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    client.engagement_score >= 70
                      ? 'bg-emerald-500'
                      : client.engagement_score >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${client.engagement_score}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-primary">{client.engagement_score}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Edit Company</h2>
              <button onClick={() => setEditing(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Industry</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                    placeholder="e.g. Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  >
                    <option value="active">Active</option>
                    <option value="at_risk">At Risk</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
