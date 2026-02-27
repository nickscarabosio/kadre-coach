'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import { Circle, CheckCircle2, Clock, Flag, FolderKanban, FileText, CheckSquare, MessageSquare, X } from 'lucide-react'
import Link from 'next/link'
import type { Task } from '@/types/database'
import { updateTaskStatus, completeRecurringTask } from '../tasks/actions'
import { logUpdate, type UpdateClassification } from '../updates/actions'

interface ActiveProject {
  id: string
  client_id: string
  title: string
  due_date: string | null
  created_at: string
  status: string
  company_name: string
}

interface ClientRow {
  id: string
  company_name: string
}

interface DashboardClientProps {
  overdueTasks: Task[]
  dueSoonTasks: Task[]
  clientMap: Record<string, string>
  coachName: string | null
  activeProjects: ActiveProject[]
  clients: ClientRow[]
}

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

const UPDATE_TYPES: { value: UpdateClassification; label: string }[] = [
  { value: 'communication', label: 'Communication' },
  { value: 'insight', label: 'Insight' },
  { value: 'admin', label: 'Admin' },
  { value: 'progress', label: 'Progress' },
  { value: 'blocker', label: 'Blocker' },
]

export function DashboardClient({
  overdueTasks: initialOverdue,
  dueSoonTasks: initialDueSoon,
  clientMap,
  coachName,
  activeProjects,
  clients,
}: DashboardClientProps) {
  const [overdueTasks, setOverdueTasks] = useState(initialOverdue)
  const [dueSoonTasks, setDueSoonTasks] = useState(initialDueSoon)
  const [showLogUpdateModal, setShowLogUpdateModal] = useState(false)
  const [logUpdateLoading, setLogUpdateLoading] = useState(false)
  const [logUpdateError, setLogUpdateError] = useState<string | null>(null)

  const handleToggleTask = async (task: Task) => {
    if (task.is_recurring && task.status !== 'completed') {
      setOverdueTasks(prev => prev.filter(t => t.id !== task.id))
      setDueSoonTasks(prev => prev.filter(t => t.id !== task.id))
      await completeRecurringTask(task.id)
    } else {
      const next = task.status === 'completed' ? 'pending' : 'completed'
      const upd = (t: Task) => (t.id === task.id ? { ...t, status: next } : t)
      setOverdueTasks(prev => prev.map(upd))
      setDueSoonTasks(prev => prev.map(upd))
      await updateTaskStatus(task.id, next)
    }
  }

  const handleLogUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLogUpdateError(null)
    setLogUpdateLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await logUpdate({
      client_id: formData.get('client_id') as string,
      content: formData.get('content') as string,
      classification: formData.get('classification') as UpdateClassification,
    })
    setLogUpdateLoading(false)
    if (res?.error) {
      setLogUpdateError(res.error)
      return
    }
    setShowLogUpdateModal(false)
    form.reset()
    window.location.reload()
  }

  const all48hTasks = [
    ...overdueTasks.filter(t => t.due_date),
    ...dueSoonTasks.filter(t => !overdueTasks.some(o => o.id === t.id)),
  ].slice(0, 15)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Welcome back{coachName ? `, ${coachName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted mt-1">Here&apos;s what&apos;s happening with your companies</p>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-surface border border-border rounded-xl shadow-card">
        <button
          type="button"
          onClick={() => setShowLogUpdateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Log Update
        </button>
        <Link
          href="/tasks"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-10 border border-border text-primary text-sm font-medium hover:bg-primary-5 transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Add Task
        </Link>
        <Link
          href="/clients"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-10 border border-border text-primary text-sm font-medium hover:bg-primary-5 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Add Check-in
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Widget 1: Active Projects */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <FolderKanban className="w-5 h-5" />
              Active Projects
            </h2>
          </div>
          {activeProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="pb-2 pr-2 font-medium">Project</th>
                    <th className="pb-2 pr-2 font-medium">Client</th>
                    <th className="pb-2 font-medium">End date</th>
                    <th className="pb-2 w-14" />
                  </tr>
                </thead>
                <tbody>
                  {activeProjects.slice(0, 8).map((project) => (
                    <tr key={project.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-2 text-primary font-medium">{project.title}</td>
                      <td className="py-2 pr-2 text-muted">{project.company_name}</td>
                      <td className="py-2 text-muted">
                        {project.due_date ? format(new Date(project.due_date + 'T12:00:00'), 'MMM d') : '—'}
                      </td>
                      <td className="py-2">
                        <Link
                          href={`/clients/${project.client_id}#section-projects`}
                          className="text-secondary hover:underline text-xs"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-sm">No active projects</p>
          )}
        </div>

        {/* Widget 2: Overdue and Upcoming Tasks */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Overdue & Upcoming</h2>
            <Link href="/tasks" className="text-sm text-secondary hover:text-secondary/80">View all</Link>
          </div>
          <div className="space-y-4">
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Overdue</h3>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <button onClick={() => handleToggleTask(task)} className="shrink-0">
                        <Circle className="w-4 h-4 text-red-500 hover:text-emerald-600" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary">{task.title}</p>
                        <p className="text-xs text-muted">
                          {task.client_id && clientMap[task.client_id]}
                          {task.due_date && (
                            <span className="text-red-600 ml-1">
                              Due {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Due in 48h</h3>
              {dueSoonTasks.length > 0 ? (
                <div className="space-y-2">
                  {dueSoonTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <button onClick={() => handleToggleTask(task)} className="shrink-0">
                        <Circle className="w-4 h-4 text-muted hover:text-emerald-600" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary">{task.title}</p>
                        <p className="text-xs text-muted">
                          {task.client_id && clientMap[task.client_id]}
                          {task.due_date && format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No tasks due in the next 48 hours</p>
              )}
            </div>
          </div>
        </div>

        {/* Widget 3: In the next 48 hours (all, overdue at top) */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">In the next 48 hours</h2>
            <Link href="/tasks" className="text-sm text-secondary hover:text-secondary/80">View all tasks</Link>
          </div>
          {all48hTasks.length > 0 ? (
            <div className="space-y-2">
              {all48hTasks.map((task) => {
                const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59'))
                return (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <button onClick={() => handleToggleTask(task)} className="shrink-0">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted hover:text-emerald-600 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.client_id && clientMap[task.client_id] && (
                          <span className="text-xs text-muted">{clientMap[task.client_id]}</span>
                        )}
                        {task.due_date && (
                          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600' : 'text-muted'}`}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                            {overdue && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs">Overdue</span>}
                          </span>
                        )}
                      </div>
                    </div>
                    <Flag className={`w-4 h-4 shrink-0 ${priorityColors[task.priority_level] || priorityColors[4]}`} />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted text-sm">No tasks due soon</p>
          )}
        </div>
      </div>

      {/* Log Update Modal */}
      {showLogUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-nav">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">Log Update</h3>
              <button
                type="button"
                onClick={() => setShowLogUpdateModal(false)}
                className="p-2 rounded-lg text-muted hover:bg-primary-5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogUpdate} className="p-4 space-y-4">
              {logUpdateError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{logUpdateError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Company</label>
                <select
                  name="client_id"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary"
                >
                  <option value="">Select company</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Type</label>
                <select
                  name="classification"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary"
                >
                  {UPDATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Update</label>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="What happened?"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-primary placeholder-muted resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogUpdateModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-primary hover:bg-primary-5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logUpdateLoading}
                  className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-secondary/90 disabled:opacity-50"
                >
                  {logUpdateLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
