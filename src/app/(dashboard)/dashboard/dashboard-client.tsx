'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import { Circle, CheckCircle2, Clock, FolderKanban, FileText, CheckSquare, MessageSquare, X, Plus, AlertTriangle, CalendarClock, Loader2, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Task } from '@/types/database'
import { updateTaskStatus, completeRecurringTask, createTask } from '../tasks/actions'
import { logUpdate, type UpdateClassification } from '../updates/actions'
import { createCoachCheckIn } from '../clients/[id]/actions'
import { Modal } from '@/components/ui/modal'
import { DatePicker } from '@/components/ui/date-picker'
import { DashboardTaskDetail } from './dashboard-task-detail'
import { toast } from 'sonner'

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

interface KpiCounts {
  overdue: number
  dueToday: number
  inProgress: number
  completed: number
}

interface DashboardClientProps {
  overdueTasks: Task[]
  dueSoonTasks: Task[]
  clientMap: Record<string, string>
  coachName: string | null
  activeProjects: ActiveProject[]
  clients: ClientRow[]
  kpiCounts: KpiCounts
}

const priorityLabels: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }

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
  kpiCounts,
}: DashboardClientProps) {
  const [overdueTasks, setOverdueTasks] = useState(initialOverdue)
  const [dueSoonTasks, setDueSoonTasks] = useState(initialDueSoon)
  const [showLogUpdateModal, setShowLogUpdateModal] = useState(false)
  const [logUpdateLoading, setLogUpdateLoading] = useState(false)
  const [logUpdateError, setLogUpdateError] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [taskPriority, setTaskPriority] = useState(3)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [taskDueDate, setTaskDueDate] = useState<string>('')
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0])
  const router = useRouter()

  const handleToggleTask = async (task: Task) => {
    if (task.is_recurring && task.status !== 'completed') {
      setOverdueTasks(prev => prev.filter(t => t.id !== task.id))
      setDueSoonTasks(prev => prev.filter(t => t.id !== task.id))
      await completeRecurringTask(task.id)
      toast.success('Task completed')
    } else {
      const next = task.status === 'completed' ? 'pending' : 'completed'
      const upd = (t: Task) => (t.id === task.id ? { ...t, status: next } : t)
      setOverdueTasks(prev => prev.map(upd))
      setDueSoonTasks(prev => prev.map(upd))
      await updateTaskStatus(task.id, next)
      toast.success(next === 'completed' ? 'Task completed' : 'Task reopened')
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

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTaskLoading(true)
    const fd = new FormData(e.currentTarget)
    await createTask({
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || null,
      priority: `p${taskPriority}`,
      priority_level: taskPriority,
      due_date: taskDueDate || null,
      client_id: (fd.get('client_id') as string) || null,
    })
    setShowTaskModal(false)
    setTaskLoading(false)
    setTaskPriority(3)
    setTaskDueDate('')
    toast.success('Task created')
    router.refresh()
  }

  const handleCreateCheckIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCheckInLoading(true)
    const fd = new FormData(e.currentTarget)
    const clientId = fd.get('client_id') as string
    if (!clientId) {
      setCheckInLoading(false)
      return
    }
    await createCoachCheckIn(clientId, {
      check_in_type: fd.get('check_in_type') as string,
      title: (fd.get('title') as string) || null,
      notes: (fd.get('notes') as string) || null,
      duration_minutes: fd.get('duration_minutes') ? parseInt(fd.get('duration_minutes') as string) : null,
      check_in_date: checkInDate,
    })
    setShowCheckInModal(false)
    setCheckInLoading(false)
    toast.success('Check-in logged')
    router.refresh()
  }

  const kpiCards: { label: string; count: number; colorClass: string; icon: typeof AlertTriangle }[] = [
    { label: 'Overdue', count: kpiCounts.overdue, colorClass: 'text-red-600', icon: AlertTriangle },
    { label: 'Due Today', count: kpiCounts.dueToday, colorClass: 'text-muted', icon: CalendarClock },
    { label: 'In Progress', count: kpiCounts.inProgress, colorClass: 'text-secondary', icon: Loader2 },
    { label: 'Completed', count: kpiCounts.completed, colorClass: 'text-emerald-600', icon: CircleCheck },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Welcome back{coachName ? `, ${coachName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted mt-1">Here&apos;s what&apos;s happening with your companies</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-surface border border-border rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${kpi.colorClass}`} />
                <span className={`text-xs font-medium ${kpi.colorClass}`}>{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-primary">{kpi.count}</p>
            </div>
          )
        })}
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
        <button
          type="button"
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-10 border border-border text-primary text-sm font-medium hover:bg-primary-5 transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Add Task
        </button>
        <button
          type="button"
          onClick={() => setShowCheckInModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-10 border border-border text-primary text-sm font-medium hover:bg-primary-5 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Add Check-in
        </button>
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
                        {project.due_date ? format(new Date(project.due_date + 'T12:00:00'), 'MMM d') : '\u2014'}
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

        {/* Widget 2: Upcoming Tasks (consolidated) */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Upcoming Tasks</h2>
            <Link href="/tasks" className="text-sm text-secondary hover:text-secondary/80">View all</Link>
          </div>
          <div className="space-y-4">
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Overdue</h3>
                <div className="space-y-2">
                  {overdueTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <button onClick={() => handleToggleTask(task)} className="shrink-0">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-red-500 hover:text-emerald-600" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setDetailTask(task)}
                          className={`text-sm text-left hover:underline ${task.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}
                        >
                          {task.title}
                        </button>
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
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Due Soon</h3>
              {dueSoonTasks.length > 0 ? (
                <div className="space-y-2">
                  {dueSoonTasks.map((task) => {
                    const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59'))
                    return (
                      <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <button onClick={() => handleToggleTask(task)} className="shrink-0">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted hover:text-emerald-600" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setDetailTask(task)}
                            className={`text-sm text-left hover:underline ${task.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}
                          >
                            {task.title}
                          </button>
                          <p className="text-xs text-muted">
                            {task.client_id && clientMap[task.client_id]}
                            {task.due_date && (
                              <span className={`ml-1 inline-flex items-center gap-1 ${overdue ? 'text-red-600' : ''}`}>
                                <Clock className="w-3 h-3" />
                                {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">No tasks due in the next 48 hours</p>
              )}
            </div>
          </div>
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
                  {logUpdateLoading ? 'Saving\u2026' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
            <input
              name="title"
              type="text"
              required
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Priority</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    taskPriority === p
                      ? p === 1 ? 'bg-red-50 border-red-200 text-red-700'
                        : p === 2 ? 'bg-orange-50 border-orange-200 text-orange-700'
                        : p === 3 ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        : 'bg-primary-5 border-border-strong text-muted'
                      : 'bg-surface border-border text-muted hover:bg-primary-5'
                  }`}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Due Date</label>
              <DatePicker value={taskDueDate || null} onChange={setTaskDueDate} placeholder="Select due date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Company</label>
              <select
                name="client_id"
                defaultValue=""
                className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              >
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={taskLoading}
              className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
            >
              {taskLoading ? 'Creating...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Check-in Modal */}
      <Modal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Log Check-in">
        <form onSubmit={handleCreateCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Company *</label>
            <select
              name="client_id"
              required
              defaultValue=""
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            >
              <option value="" disabled>Select company</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Type *</label>
            <select
              name="check_in_type"
              defaultValue="call"
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="in-person">In Person</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Title</label>
            <input
              name="title"
              type="text"
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              placeholder="Weekly sync"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
              placeholder="What was discussed..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Date *</label>
              <DatePicker value={checkInDate} onChange={setCheckInDate} placeholder="Select date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Duration (min)</label>
              <input
                name="duration_minutes"
                type="number"
                min="1"
                className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCheckInModal(false)}
              className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={checkInLoading}
              className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
            >
              {checkInLoading ? 'Saving...' : 'Log Check-in'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Slide-over */}
      {detailTask && (
        <DashboardTaskDetail
          task={detailTask}
          clientMap={clientMap}
          open={!!detailTask}
          onClose={() => setDetailTask(null)}
          onToggle={(task) => { handleToggleTask(task); setDetailTask(null) }}
        />
      )}
    </div>
  )
}
