import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Briefcase,
  Calendar,
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

  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    at_risk: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>

        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-10 h-10 text-zinc-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{client.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[client.status as keyof typeof statusColors] || statusColors.active}`}>
                {client.status === 'at_risk' ? 'At Risk' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-zinc-400">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {client.email}
              </span>
              {client.company && (
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {client.company}
                </span>
              )}
              {client.role && (
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {client.role}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-400 mb-1">Engagement Score</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    client.engagement_score >= 70
                      ? 'bg-green-500'
                      : client.engagement_score >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${client.engagement_score}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-white">{client.engagement_score}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{reflections?.length || 0}</p>
              <p className="text-sm text-zinc-400">Check-ins</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{sessionNotes?.length || 0}</p>
              <p className="text-sm text-zinc-400">Session Notes</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{messages?.length || 0}</p>
              <p className="text-sm text-zinc-400">Messages</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-sm text-zinc-400">Started</p>
            </div>
          </div>
        </div>
      </div>

      <ClientTabs
        clientId={client.id}
        reflections={reflections || []}
        sessionNotes={sessionNotes || []}
        messages={messages || []}
      />
    </div>
  )
}
