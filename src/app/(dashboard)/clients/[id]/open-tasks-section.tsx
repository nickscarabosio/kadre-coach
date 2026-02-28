'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import { CheckSquare, Plus, Circle, CheckCircle2, Flag, Clock } from 'lucide-react'
import type { Task } from '@/types/database'
import { updateTaskStatus, createTask } from '../../tasks/actions'
import { SlideOver } from '@/components/ui/slide-over'
import { toast } from 'sonner'

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

interface OpenTasksSectionProps {
  clientId: string
  tasks: Task[]
  projectMap?: Record<string, string>
}

export function OpenTasksSection({ clientId, tasks: initialTasks, projectMap = {} }: OpenTasksSectionProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleToggle = async (task: Task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next, completed_at: next === 'completed' ? new Date().toISOString() : null } : t))
    if (detailTask?.id === task.id) {
      setDetailTask(prev => prev ? { ...prev, status: next, completed_at: next === 'completed' ? new Date().toISOString() : null } : prev)
    }
    await updateTaskStatus(task.id, next)
    toast.success(next === 'completed' ? 'Task completed' : 'Task reopened')
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addTitle.trim()) return
    setAdding(true)
    const result = await createTask({
      title: addTitle,
      client_id: clientId,
      priority: 'medium',
      priority_level: 4,
    })
    if (!result.error) {
      const optimistic: Task = {
        id: crypto.randomUUID(),
        coach_id: '',
        title: addTitle,
        description: null,
        status: 'pending',
        priority: 'medium',
        priority_level: 4,
        due_date: null,
        due_time: null,
        client_id: clientId,
        project_id: null,
        milestone_id: null,
        section_id: null,
        parent_task_id: null,
        assigned_to_coach_id: null,
        is_recurring: false,
        recurrence_rule: null,
        sort_order: tasks.length,
        completed_at: null,
        todoist_id: null,
        todoist_sync_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setTasks(prev => [...prev, optimistic])
      setAddTitle('')
      setShowAddForm(false)
      toast.success('Task created')
    }
    setAdding(false)
  }

  const visibleTasks = tasks.filter(t => t.status !== 'completed')

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Next Steps
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary-10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        </div>

        {visibleTasks.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted">No open tasks. Add a task to get started.</p>
        ) : (
          <ul className="space-y-1">
            {visibleTasks.map((task) => {
              const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59'))
              const projectName = task.project_id ? projectMap[task.project_id] : null

              return (
                <li key={task.id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary-5 transition-colors group">
                  <button
                    onClick={() => handleToggle(task)}
                    className="shrink-0"
                  >
                    <Circle className="w-4.5 h-4.5 text-muted hover:text-emerald-600 transition-colors" />
                  </button>
                  <button
                    onClick={() => setDetailTask(task)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="text-sm text-primary group-hover:text-secondary">{task.title}</span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {projectName && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {projectName}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted'}`}>
                        {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Inline Add Form */}
        {showAddForm && (
          <form onSubmit={handleQuickAdd} className="mt-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-muted shrink-0" />
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="Add a task..."
              autoFocus
              disabled={adding}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-primary placeholder-muted border-b border-border focus:border-secondary focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowAddForm(false)
                  setAddTitle('')
                }
              }}
            />
            <button
              type="submit"
              disabled={adding || !addTitle.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-secondary text-white rounded-lg disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddTitle('') }}
              className="px-3 py-1.5 text-xs font-medium text-muted hover:text-primary"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Lightweight Task Detail Slide-Over */}
      {detailTask && (
        <SlideOver open={!!detailTask} onClose={() => setDetailTask(null)} title="Task Details">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <button onClick={() => handleToggle(detailTask)} className="shrink-0 mt-1">
                {detailTask.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Circle className="w-6 h-6 text-muted hover:text-emerald-600 transition-colors" />
                )}
              </button>
              <h3 className={`text-lg font-semibold ${detailTask.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                {detailTask.title}
              </h3>
            </div>

            {detailTask.description && (
              <div>
                <p className="text-xs text-muted uppercase font-medium mb-1">Description</p>
                <p className="text-sm text-primary/80 whitespace-pre-wrap">{detailTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted uppercase font-medium mb-1">Priority</p>
                <div className="flex items-center gap-2">
                  <Flag className={`w-4 h-4 ${priorityColors[detailTask.priority_level] || priorityColors[4]}`} />
                  <span className="text-sm text-primary">
                    {detailTask.priority_level <= 2 ? 'High' : detailTask.priority_level === 3 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
              {detailTask.due_date && (
                <div>
                  <p className="text-xs text-muted uppercase font-medium mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isAfter(new Date(), new Date(detailTask.due_date + 'T23:59:59')) ? 'text-red-500' : 'text-muted'}`} />
                    <span className={`text-sm ${isAfter(new Date(), new Date(detailTask.due_date + 'T23:59:59')) ? 'text-red-600 font-medium' : 'text-primary'}`}>
                      {format(new Date(detailTask.due_date + 'T12:00:00'), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {detailTask.project_id && projectMap[detailTask.project_id] && (
              <div>
                <p className="text-xs text-muted uppercase font-medium mb-1">Project</p>
                <span className="text-sm text-primary">{projectMap[detailTask.project_id]}</span>
              </div>
            )}
          </div>
        </SlideOver>
      )}
    </>
  )
}
