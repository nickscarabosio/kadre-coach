import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Calendar, FolderKanban, CheckSquare } from 'lucide-react'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>
}) {
  const { id: clientId, projectId } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('client_projects')
    .select('*')
    .eq('id', projectId)
    .eq('client_id', clientId)
    .single()

  if (error || !project) notFound()

  const { data: client } = await supabase
    .from('clients')
    .select('company_name')
    .eq('id', clientId)
    .single()

  const { data: projectTasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, status, priority_level')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false })

  const statusLabel = project.status === 'active' ? 'In Progress' : project.status === 'on_hold' ? 'On Hold' : project.status.charAt(0).toUpperCase() + project.status.slice(1)

  return (
    <div className="p-8">
      <Link
        href={`/clients/${clientId}#section-projects`}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {client?.company_name || 'Client'}
      </Link>

      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary-5">
              <FolderKanban className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-primary">{project.title}</h1>
              <p className="text-sm text-muted mt-1">{client?.company_name}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Calendar className="w-4 h-4" />
                  Started {format(new Date(project.created_at), 'MMM d, yyyy')}
                </span>
                {project.due_date && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                    Due {format(new Date(project.due_date + 'T12:00:00'), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-primary border border-border">
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {project.description && (
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Description</h2>
            <p className="text-sm text-primary whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Related tasks ({projectTasks?.length ?? 0})
          </h2>
          {projectTasks && projectTasks.length > 0 ? (
            <ul className="space-y-2">
              {projectTasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href="/tasks"
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-primary-5 text-sm text-primary"
                  >
                    <span>{task.title}</span>
                    <span className="text-xs text-muted">
                      {task.due_date ? format(new Date(task.due_date + 'T12:00:00'), 'MMM d') : 'No date'}
                      {task.status === 'completed' && ' · Done'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No tasks linked to this project yet.</p>
          )}
          <Link
            href={`/tasks?client=${clientId}&project=${projectId}`}
            className="inline-flex items-center gap-2 mt-3 text-sm text-secondary hover:underline"
          >
            <CheckSquare className="w-4 h-4" />
            Add task to this project
          </Link>
        </div>
      </div>
    </div>
  )
}
