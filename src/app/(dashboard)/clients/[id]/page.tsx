import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  MessageSquare,
  FileText,
  Activity,
  FolderKanban,
  ChevronRight,
} from 'lucide-react'
import { ClientTabs } from './client-tabs'
import { ClientHeader } from './client-header'
import { TeamContacts } from './team-contacts'
import { ProjectBoard } from './project-board'
import { OpenTasksSection } from './open-tasks-section'

export const dynamic = 'force-dynamic'

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
    { data: openTasks },
    { data: projectTasks },
  ] = await Promise.all([
    supabase.from('reflections').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('session_notes').select('*').eq('client_id', id).order('session_date', { ascending: false }).limit(10),
    supabase.from('messages').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('telegram_updates').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('contacts').select('*').eq('client_id', id).order('is_primary', { ascending: false }),
    supabase.from('coach_check_ins').select('*').eq('client_id', id).order('check_in_date', { ascending: false }).limit(20),
    supabase.from('client_projects').select('*').eq('client_id', id).order('sort_order'),
    supabase.from('tasks').select('*').eq('client_id', id).neq('status', 'completed').order('due_date', { ascending: true, nullsFirst: false }).limit(15),
    supabase.from('tasks').select('*').eq('client_id', id).not('project_id', 'is', null).order('sort_order'),
  ])

  // Fetch milestones for all projects
  const projectIds = (projects || []).map(p => p.id)
  const { data: milestones } = projectIds.length > 0
    ? await supabase.from('project_milestones').select('*').in('project_id', projectIds).order('sort_order')
    : { data: [] as any[] }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ClientHeader client={client} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Activity, color: 'text-secondary', count: reflections?.length || 0, label: 'Check-ins', href: '#section-check-ins' },
          { icon: FileText, color: 'text-violet-600', count: sessionNotes?.length || 0, label: 'Session Notes', href: '#section-notes' },
          { icon: MessageSquare, color: 'text-emerald-600', count: messages?.length || 0, label: 'Messages', href: '#section-messages' },
          { icon: FolderKanban, color: 'text-amber-600', count: projects?.length || 0, label: 'Projects', href: '#section-projects' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <a key={stat.label} href={stat.href} className="group bg-surface border border-border hover:border-secondary/30 rounded-xl p-4 shadow-card transition-colors block">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <div className="flex-1">
                  <p className="text-2xl font-bold text-primary">{stat.count}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          )
        })}
      </div>

      <TeamContacts clientId={id} contacts={contacts || []} />

      {/* Next Steps / Open Tasks */}
      <OpenTasksSection clientId={id} tasks={openTasks || []} projectMap={Object.fromEntries((projects || []).map(p => [p.id, p.title]))} />

      {/* Project Board */}
      <div id="section-projects" className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6 scroll-mt-4">
        <h2 className="text-lg font-semibold text-primary mb-4">Projects</h2>
        <ProjectBoard clientId={id} projects={projects || []} projectTasks={projectTasks || []} milestones={milestones || []} />
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
