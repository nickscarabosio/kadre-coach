'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { updateTaskStatus, deleteTask, createTask, completeRecurringTask, updateTask } from './actions'
import { createClient } from '@/lib/supabase/client'
import { AddTaskButton } from './add-task-button'
import { SectionManager } from './section-manager'
import { TaskDetailPanel } from './task-detail-panel'

type FilterMode = 'all' | 'today' | 'upcoming' | 'completed'

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [sections, setSections] = useState<TaskSection[]>([])
  const [labels, setLabels] = useState<TaskLabel[]>([])
  const [labelAssignments, setLabelAssignments] = useState<{ task_id: string; label_id: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [tasksRes, clientsRes, sectionsRes, labelsRes, assignmentsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('coach_id', user.id).order('sort_order').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('coach_id', user.id),
      supabase.from('task_sections').select('*').eq('coach_id', user.id).order('sort_order'),
      supabase.from('task_labels').select('*').eq('coach_id', user.id).order('name'),
      supabase.from('task_label_assignments').select('task_id, label_id'),
    ])

    setTasks(tasksRes.data || [])
    setClients(clientsRes.data || [])
    setSections(sectionsRes.data || [])
    setLabels(labelsRes.data || [])
    setLabelAssignments(assignmentsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))
  const labelMap = Object.fromEntries(labels.map(l => [l.id, l]))
  const taskLabels = (taskId: string) =>
    labelAssignments.filter(a => a.task_id === taskId).map(a => labelMap[a.label_id]).filter(Boolean)

  const subtaskCounts: Record<string, { total: number; done: number }> = {}
  for (const t of tasks) {
    if (t.parent_task_id) {
      if (!subtaskCounts[t.parent_task_id]) subtaskCounts[t.parent_task_id] = { total: 0, done: 0 }
      subtaskCounts[t.parent_task_id].total++
      if (t.status === 'completed') subtaskCounts[t.parent_task_id].done++
    }
  }

  const now = new Date()
  let filtered = tasks
    .filter(t => !t.parent_task_id)
    .filter(t => {
      if (selectedSection === null) return true
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

  // Optimistic handlers
  const handleStatusToggle = async (task: Task) => {
    if (task.is_recurring && task.status !== 'completed') {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t))
      await completeRecurringTask(task.id)
      fetchData()
    } else {
      const next = task.status === 'completed' ? 'pending' : 'completed'
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next, completed_at: next === 'completed' ? new Date().toISOString() : null } : t))
      await updateTaskStatus(task.id, next)
    }
  }

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await deleteTask(taskId)
  }

  const handleUpdate = (taskId: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t))
    if (detailTask?.id === taskId) {
      setDetailTask(prev => prev ? { ...prev, ...data } : prev)
    }
  }

  const handleInlinePriorityCycle = async (task: Task) => {
    const next = task.priority_level === 1 ? 4 : task.priority_level - 1
    const priorityMap: Record<number, string> = { 1: 'high', 2: 'high', 3: 'medium', 4: 'low' }
    handleUpdate(task.id, { priority_level: next, priority: priorityMap[next] })
    await updateTask(task.id, { priority_level: next, priority: priorityMap[next] })
  }

  const handleInlineDateChange = async (task: Task, date: string) => {
    handleUpdate(task.id, { due_date: date || null })
    await updateTask(task.id, { due_date: date || null })
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
    fetchData()
  }

  const handleTaskCreated = () => { fetchData() }
  const handleSectionCreated = () => { fetchData() }

  const subtasksForTask = (parentId: string) =>
    tasks.filter(t => t.parent_task_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  const allTasks = tasks.filter(t => !t.parent_task_id)
  const pendingCount = allTasks.filter(t => t.status === 'pending').length
  const inProgressCount = allTasks.filter(t => t.status === 'in_progress').length
  const completedCount = allTasks.filter(t => t.status === 'completed').length

  const filters: { label: string; value: FilterMode }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-primary-5 rounded animate-pulse" />
            <div className="h-4 w-48 bg-primary-5 rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-primary-5 rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-primary-5 rounded-lg animate-pulse" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-primary-5 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tasks</h1>
          <p className="text-muted mt-1">
            {pendingCount} pending · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SectionManager onCreated={handleSectionCreated} />
          <AddTaskButton clients={clients} sections={sections} labels={labels} onTaskCreated={handleTaskCreated} />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <h3 className="text-primary font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted mb-4">Create your first task to stay organized</p>
          <AddTaskButton clients={clients} sections={sections} labels={labels} onTaskCreated={handleTaskCreated} />
        </div>
      ) : (
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

            <div className="space-y-1">
              {filtered.map((task) => {
                const client = task.client_id ? clientMap[task.client_id] : null
                const tLabels = taskLabels(task.id)
                const overdue = task.due_date && isAfter(now, new Date(task.due_date + 'T23:59:59')) && task.status !== 'completed'
                const isExpanded = expandedTasks.has(task.id)
                const subs = subtasksForTask(task.id)
                const subCount = subtaskCounts[task.id]

                return (
                  <div key={task.id} className="bg-surface border border-border rounded-lg shadow-subtle">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => handleStatusToggle(task)}
                        className="shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted hover:text-emerald-600 transition-colors" />
                        )}
                      </button>

                      <button
                        onClick={() => handleInlinePriorityCycle(task)}
                        className="shrink-0"
                        title={`Priority ${task.priority_level} — click to change`}
                      >
                        <Flag className={`w-4 h-4 ${priorityColors[task.priority_level] || priorityColors[4]}`} />
                      </button>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setDetailTask(task)}
                      >
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
                          {client && (
                            <span className="text-xs text-muted">{client.company_name || client.name}</span>
                          )}
                          {subCount && (
                            <span className="text-xs text-muted">{subCount.done}/{subCount.total}</span>
                          )}
                        </div>
                      </div>

                      {/* Inline date picker */}
                      <input
                        type="date"
                        value={task.due_date || ''}
                        onChange={(e) => handleInlineDateChange(task, e.target.value)}
                        className={`shrink-0 w-28 px-1 py-0.5 text-xs rounded border border-transparent hover:border-border-strong focus:border-secondary focus:outline-none ${
                          overdue ? 'text-red-600 font-medium' : 'text-muted'
                        }`}
                      />

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
      )}

      {/* Detail Panel */}
      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          clients={clients}
          sections={sections}
          labels={labels}
          taskLabelIds={labelAssignments.filter(a => a.task_id === detailTask.id).map(a => a.label_id)}
          subtasks={subtasksForTask(detailTask.id)}
          open={!!detailTask}
          onClose={() => setDetailTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
