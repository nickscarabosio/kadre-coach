import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building,
  Mail,
  Globe,
  MessageSquare,
  FileText,
  Activity,
} from 'lucide-react'
import { ClientTabs } from './client-tabs'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: sessionNotes } = await supabase
    .from('session_notes')
    .select('*')
    .eq('client_id', id)
    .order('session_date', { ascending: false })
    .limit(10)

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: updates } = await supabase
    .from('telegram_updates')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('client_id', id)
    .order('is_primary', { ascending: false })

  const { data: coachCheckIns } = await supabase
    .from('coach_check_ins')
    .select('*')
    .eq('client_id', id)
    .order('check_in_date', { ascending: false })
    .limit(20)

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
    inactive: 'bg-primary-5 text-muted border-border',
    completed: 'bg-secondary-10 text-secondary border-secondary-20',
  }

  return (
    <div className="p-8">
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[client.status as keyof typeof statusColors] || statusColors.active}`}>
                {client.status === 'at_risk' ? 'At Risk' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
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

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-2xl font-bold text-primary">{reflections?.length || 0}</p>
              <p className="text-sm text-muted">Check-ins</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-violet-600" />
            <div>
              <p className="text-2xl font-bold text-primary">{sessionNotes?.length || 0}</p>
              <p className="text-sm text-muted">Session Notes</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-primary">{messages?.length || 0}</p>
              <p className="text-sm text-muted">Messages</p>
            </div>
          </div>
        </div>
      </div>

      {contacts && contacts.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Team Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 p-3 bg-primary-5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-semibold text-primary">
                  {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {contact.name}
                    {contact.is_primary && <span className="ml-1.5 text-xs text-secondary">(Primary)</span>}
                  </p>
                  <p className="text-xs text-muted truncate">{contact.role || contact.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ClientTabs
        clientId={client.id}
        reflections={reflections || []}
        sessionNotes={sessionNotes || []}
        messages={messages || []}
        updates={updates || []}
        coachCheckIns={coachCheckIns || []}
      />
    </div>
  )
}
