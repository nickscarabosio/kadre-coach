import { createClient } from '@/lib/supabase/server'
import { CheckSquare } from 'lucide-react'
import { AddTaskButton } from './add-task-button'
import { TaskBoard } from './task-board'
import { SectionManager } from './section-manager'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = user ? await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false }) : { data: null }

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id) : { data: null }

  const { data: sections } = user ? await supabase
    .from('task_sections')
    .select('*')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: true }) : { data: null }

  const { data: labels } = user ? await supabase
    .from('task_labels')
    .select('*')
    .eq('coach_id', user.id)
    .order('name') : { data: null }

  const { data: labelAssignments } = user ? await supabase
    .from('task_label_assignments')
    .select('task_id, label_id') : { data: null }

  const allTasks = tasks || []
  const pendingCount = allTasks.filter(t => t.status === 'pending' && !t.parent_task_id).length
  const inProgressCount = allTasks.filter(t => t.status === 'in_progress' && !t.parent_task_id).length
  const completedCount = allTasks.filter(t => t.status === 'completed' && !t.parent_task_id).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tasks</h1>
          <p className="text-muted mt-1">
            {pendingCount} pending · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SectionManager />
          <AddTaskButton clients={clients || []} sections={sections || []} labels={labels || []} />
        </div>
      </div>

      {allTasks.length > 0 ? (
        <TaskBoard
          tasks={allTasks}
          clients={clients || []}
          sections={sections || []}
          labels={labels || []}
          labelAssignments={labelAssignments || []}
        />
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <CheckSquare className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted mb-4">Create your first task to stay organized</p>
          <AddTaskButton clients={clients || []} sections={sections || []} labels={labels || []} />
        </div>
      )}
    </div>
  )
}
