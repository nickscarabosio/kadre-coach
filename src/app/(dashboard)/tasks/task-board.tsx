'use client'

import { useState } from 'react'
import { Task, Client, TaskSection, TaskLabel } from '@/types/database'
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns'
import {
  Circle,
  CheckCircle2,
  Flag,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
} from 'lucide-react'
import { updateTaskStatus, deleteTask, createTask, completeRecurringTask } from './actions'
import { useRouter } from 'next/navigation'

interface TaskBoardProps {
  tasks: Task[]
  clients: Client[]
  sections: TaskSection[]
  labels: TaskLabel[]
  labelAssignments: { task_id: string; label_id: string }[]
}

type FilterMode = 'all' | 'today' | 'upcoming' | 'completed'

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

export function TaskBoard({ tasks, clients, sections, labels, labelAssignments }: TaskBoardProps) {
  const router = useRouter()
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))
  const labelMap = Object.fromEntries(labels.map(l => [l.id, l]))
  const taskLabels = (taskId: string) =>
    labelAssignments.filter(a => a.task_id === taskId).map(a => labelMap[a.label_id]).filter(Boolean)

  // Count subtasks per parent
  const subtaskCounts: Record<string, { total: number; done: number }> = {}
  for (const t of tasks) {
    if (t.parent_task_id) {
      if (!subtaskCounts[t.parent_task_id]) subtaskCounts[t.parent_task_id] = { total: 0, done: 0 }
      subtaskCounts[t.parent_task_id].total++
      if (t.status === 'completed') subtaskCounts[t.parent_task_id].done++
    }
  }

  // Filter tasks
  const now = new Date()
  let filtered = tasks
    .filter(t => !t.parent_task_id) // only top-level
    .filter(t => {
      if (selectedSection === null) return true // show all
      if (selectedSection === 'inbox') return !t.section_id
      return t.section_id === selectedSection
    })
    .filter(t => {
      if (filter === 'today') return t.due_date && isToday(new Date(t.due_date + 'T12:00:00'))
      if (filter === 'upcoming') return t.due_date && isAfter(new Date(t.due_date + 'T12:00:00'), now) && isBefore(new Date(t.due_date + 'T12:00:00'), addDays(now, 7))
      if (filter === 'completed') return t.status === 'completed'
      return true
    })
    .filter(t => {
      if (!search) return true
      return t.title.toLowerCase().includes(search.toLowerCase())
    })

  if (filter !== 'completed') {
    filtered = filtered.filter(t => t.status !== 'completed')
  }

  filtered.sort((a, b) => a.sort_order - b.sort_order)

  const handleStatusToggle = async (task: Task) => {
    if (task.is_recurring && task.status !== 'completed') {
      await completeRecurringTask(task.id)
    } else {
      const next = task.status === 'completed' ? 'pending' : 'completed'
      await updateTaskStatus(task.id, next)
    }
    router.refresh()
  }

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId)
    router.refresh()
  }

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAddTitle.trim()) return
    setAddingTask(true)
    await createTask({
      title: quickAddTitle,
      priority: 'medium',
      priority_level: 4,
      section_id: selectedSection === 'inbox' ? null : selectedSection,
    })
    setQuickAddTitle('')
    setAddingTask(false)
    router.refresh()
  }

  const subtasks = (parentId: string) =>
    tasks.filter(t => t.parent_task_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  const filters: { label: string; value: FilterMode }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div className="flex gap-6">
      {/* Section Sidebar */}
      <div className="w-48 shrink-0">
        <div className="bg-surface border border-border rounded-xl shadow-card p-3 sticky top-20">
          <button
            onClick={() => setSelectedSection(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSection === null ? 'bg-secondary-10 text-secondary' : 'text-muted hover:bg-primary-5 hover:text-primary'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setSelectedSection('inbox')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSection === 'inbox' ? 'bg-secondary-10 text-secondary' : 'text-muted hover:bg-primary-5 hover:text-primary'
            }`}
          >
            Inbox
          </button>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSection === s.id ? 'bg-secondary-10 text-secondary' : 'text-muted hover:bg-primary-5 hover:text-primary'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Task Area */}
      <div className="flex-1">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f.value ? 'bg-secondary text-white' : 'text-muted hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>

        {/* Task List */}
        <div className="space-y-1">
          {filtered.map((task) => {
            const client = task.client_id ? clientMap[task.client_id] : null
            const tLabels = taskLabels(task.id)
            const overdue = task.due_date && isAfter(now, new Date(task.due_date + 'T23:59:59')) && task.status !== 'completed'
            const isExpanded = expandedTasks.has(task.id)
            const subs = subtasks(task.id)
            const subCount = subtaskCounts[task.id]

            return (
              <div key={task.id} className="bg-surface border border-border rounded-lg shadow-subtle">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => handleStatusToggle(task)}
                    className="shrink-0"
                    title={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted hover:text-emerald-600 transition-colors" />
                    )}
                  </button>

                  <Flag className={`w-4 h-4 shrink-0 ${priorityColors[task.priority_level] || priorityColors[4]}`} />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {tLabels.map(l => (
                        <span
                          key={l.id}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: l.color + '20', color: l.color }}
                        >
                          {l.name}
                        </span>
                      ))}
                      {task.due_date && (
                        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted'}`}>
                          {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                        </span>
                      )}
                      {client && (
                        <span className="text-xs text-muted">{client.company_name || client.name}</span>
                      )}
                      {subCount && (
                        <span className="text-xs text-muted">{subCount.done}/{subCount.total}</span>
                      )}
                    </div>
                  </div>

                  {(task.description || subs.length > 0) && (
                    <button onClick={() => toggleExpand(task.id)} className="shrink-0 text-muted hover:text-primary">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="shrink-0 text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 pt-0 border-t border-border mx-4 mt-0">
                    {task.description && (
                      <p className="text-sm text-muted mt-3 whitespace-pre-wrap">{task.description}</p>
                    )}
                    {subs.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-muted uppercase font-semibold mb-1">Subtasks</p>
                        {subs.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 pl-2">
                            <button onClick={() => handleStatusToggle(sub)} className="shrink-0">
                              {sub.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted" />
                              )}
                            </button>
                            <span className={`text-sm ${sub.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted py-8 text-sm">
            {filter === 'completed' ? 'No completed tasks' : 'No tasks to show'}
          </p>
        )}

        {/* Quick Add */}
        <form onSubmit={handleQuickAdd} className="mt-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            placeholder="Add a task..."
            disabled={addingTask}
            className="flex-1 px-3 py-2 bg-transparent text-sm text-primary placeholder-muted focus:outline-none"
          />
        </form>
      </div>
    </div>
  )
}
