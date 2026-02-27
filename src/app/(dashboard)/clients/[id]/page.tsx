import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  MessageSquare,
  FileText,
  Activity,
  FolderKanban,
} from 'lucide-react'
import { ClientTabs } from './client-tabs'
import { ClientHeader } from './client-header'
import { TeamContacts } from './team-contacts'
import { ProjectBoard } from './project-board'

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

  const [
    { data: reflections },
    { data: sessionNotes },
    { data: messages },
    { data: updates },
    { data: contacts },
    { data: coachCheckIns },
    { data: projects },
  ] = await Promise.all([
    supabase.from('reflections').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('session_notes').select('*').eq('client_id', id).order('session_date', { ascending: false }).limit(10),
    supabase.from('messages').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('telegram_updates').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('contacts').select('*').eq('client_id', id).order('is_primary', { ascending: false }),
    supabase.from('coach_check_ins').select('*').eq('client_id', id).order('check_in_date', { ascending: false }).limit(20),
    supabase.from('client_projects').select('*').eq('client_id', id).order('sort_order'),
  ])

  return (
    <div className="p-8">
      <ClientHeader client={client} />

      <div className="grid grid-cols-4 gap-4 mb-8">
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
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-primary">{projects?.length || 0}</p>
              <p className="text-sm text-muted">Projects</p>
            </div>
          </div>
        </div>
      </div>

      <TeamContacts clientId={id} contacts={contacts || []} />

      {/* Project Board */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Projects</h2>
        <ProjectBoard clientId={id} projects={projects || []} />
      </div>

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
