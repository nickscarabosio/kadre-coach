'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import {
  Circle,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  Flag,
  ChevronDown,
} from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
import { DatePicker } from '@/components/ui/date-picker'
import type { ClientProject, Task, ProjectMilestone } from '@/types/database'
import { updateProject, deleteProject } from './project-actions'
import { createMilestone, updateMilestone, deleteMilestone, toggleMilestoneStatus } from './milestone-actions'
import { createTask, updateTaskStatus } from '../../tasks/actions'
import { toast } from 'sonner'

interface ProjectDetailPanelProps {
  project: ClientProject
  clientId: string
  tasks: Task[]
  milestones: ProjectMilestone[]
  open: boolean
  onClose: () => void
  onUpdate: (projectId: string, data: Partial<ClientProject>) => void
  onDelete: (projectId: string) => void
}

const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

export function ProjectDetailPanel({
  project: initialProject,
  clientId,
  tasks: initialTasks,
  milestones: initialMilestones,
  open,
  onClose,
  onUpdate,
  onDelete,
}: ProjectDetailPanelProps) {
  const [project, setProject] = useState(initialProject)
  const [tasks, setTasks] = useState(initialTasks)
  const [milestones, setMilestones] = useState(initialMilestones)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(project.title)
  const [descValue, setDescValue] = useState(project.description || '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDueDate, setMilestoneDueDate] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [taskMilestoneId, setTaskMilestoneId] = useState<string>('')

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const pendingMilestones = milestones.filter(m => m.status !== 'completed').sort((a, b) => a.sort_order - b.sort_order)
  const completedMilestones = milestones.filter(m => m.status === 'completed').sort((a, b) => a.sort_order - b.sort_order)

  const handleFieldSave = async (field: string, value: unknown) => {
    const data = { [field]: value }
    setProject(prev => ({ ...prev, ...data } as ClientProject))
    onUpdate(project.id, data as Partial<ClientProject>)
    await updateProject(project.id, clientId, data)
  }

  const handleTitleBlur = () => {
    setEditingTitle(false)
    if (titleValue !== project.title) {
      handleFieldSave('title', titleValue)
    }
  }

  const handleDescBlur = () => {
    setEditingDesc(false)
    if (descValue !== (project.description || '')) {
      handleFieldSave('description', descValue || null)
    }
  }

  const handleDeleteProject = async () => {
    onDelete(project.id)
    await deleteProject(project.id, clientId)
    toast.success('Project deleted')
    onClose()
  }

  const handleToggleTask = async (task: Task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    await updateTaskStatus(task.id, next)
    toast.success(next === 'completed' ? 'Task completed' : 'Task reopened')
  }

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    setAddingTask(true)
    await createTask({
      title: quickTaskTitle,
      client_id: clientId,
      project_id: project.id,
      milestone_id: taskMilestoneId || null,
      priority: 'medium',
      priority_level: 4,
    })
    const optimistic: Task = {
      id: crypto.randomUUID(),
      coach_id: '',
      client_id: clientId,
      project_id: project.id,
      milestone_id: taskMilestoneId || null,
      assigned_to_coach_id: null,
      title: quickTaskTitle,
      description: null,
      due_date: null,
      due_time: null,
      status: 'pending',
      priority: 'medium',
      priority_level: 4,
      parent_task_id: null,
      section_id: null,
      sort_order: tasks.length,
      is_recurring: false,
      recurrence_rule: null,
      completed_at: null,
      todoist_id: null,
      todoist_sync_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTasks(prev => [...prev, optimistic])
    setQuickTaskTitle('')
    setTaskMilestoneId('')
    setAddingTask(false)
    toast.success('Task created')
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!milestoneTitle.trim()) return
    setAddingMilestone(true)
    const result = await createMilestone(project.id, clientId, {
      title: milestoneTitle,
      due_date: milestoneDueDate || null,
    })
    if (result.milestone) {
      setMilestones(prev => [...prev, result.milestone!])
    }
    setMilestoneTitle('')
    setMilestoneDueDate('')
    setAddingMilestone(false)
    toast.success('Milestone added')
  }

  const handleToggleMilestone = async (milestone: ProjectMilestone) => {
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed'
    setMilestones(prev => prev.map(m => m.id === milestone.id ? {
      ...m,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    } : m))
    await toggleMilestoneStatus(milestone.id, clientId)
    toast.success(newStatus === 'completed' ? 'Milestone completed' : 'Milestone reopened')
  }

  const handleMilestoneTitleBlur = async (milestone: ProjectMilestone, newTitle: string) => {
    if (newTitle !== milestone.title) {
      setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, title: newTitle } : m))
      await updateMilestone(milestone.id, clientId, { title: newTitle })
    }
  }

  const handleMilestoneDateChange = async (milestone: ProjectMilestone, date: string) => {
    setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, due_date: date || null } : m))
    await updateMilestone(milestone.id, clientId, { due_date: date || null })
  }

  const handleDeleteMilestone = async (milestone: ProjectMilestone) => {
    setMilestones(prev => prev.filter(m => m.id !== milestone.id))
    await deleteMilestone(milestone.id, clientId)
    toast.success('Milestone deleted')
  }

  // Group tasks by milestone
  const tasksByMilestone: Record<string, Task[]> = { '': [] }
  for (const m of milestones) {
    tasksByMilestone[m.id] = []
  }
  for (const t of tasks) {
    const key = t.milestone_id || ''
    if (!tasksByMilestone[key]) tasksByMilestone[key] = []
    tasksByMilestone[key].push(t)
  }

  const isOverdue = project.due_date && isAfter(new Date(), new Date(project.due_date + 'T23:59:59'))

  return (
    <SlideOver open={open} onClose={onClose} title="Project Details" width="max-w-2xl">
      <div className="space-y-6">
        {/* Title */}
        <div>
          {editingTitle ? (
            <input
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={e => e.key === 'Enter' && handleTitleBlur()}
              className="text-xl font-semibold text-primary bg-transparent border-b-2 border-secondary outline-none w-full"
              autoFocus
            />
          ) : (
            <h3
              className="text-xl font-semibold text-primary cursor-pointer hover:text-secondary transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {project.title}
            </h3>
          )}
        </div>

        {/* Status + Due Date row */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Status</label>
            <select
              value={project.status}
              onChange={e => handleFieldSave('status', e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-primary"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Due Date</label>
            <DatePicker
              value={project.due_date || null}
              onChange={date => handleFieldSave('due_date', date || null)}
              placeholder="Set due date"
            />
          </div>
          {isOverdue && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded-full mt-4">Overdue</span>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-muted mb-1">Description</label>
          {editingDesc ? (
            <textarea
              value={descValue}
              onChange={e => setDescValue(e.target.value)}
              onBlur={handleDescBlur}
              rows={3}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40"
              autoFocus
            />
          ) : (
            <p
              className="text-sm text-primary/80 cursor-pointer hover:bg-primary-5 rounded-lg px-3 py-2 transition-colors min-h-[2.5rem]"
              onClick={() => setEditingDesc(true)}
            >
              {project.description || 'Click to add description...'}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted">Progress</span>
              <span className="text-xs font-medium text-primary">{completedTasks}/{totalTasks} tasks ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-primary-5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverdue && progressPercent < 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestones */}
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Milestones</h4>

          {pendingMilestones.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendingMilestones.map(milestone => {
                const mTasks = tasksByMilestone[milestone.id] || []
                const mDone = mTasks.filter(t => t.status === 'completed').length
                return (
                  <MilestoneRow
                    key={milestone.id}
                    milestone={milestone}
                    taskCount={mTasks.length}
                    doneCount={mDone}
                    onToggle={handleToggleMilestone}
                    onTitleBlur={handleMilestoneTitleBlur}
                    onDateChange={handleMilestoneDateChange}
                    onDelete={handleDeleteMilestone}
                  />
                )
              })}
            </div>
          )}

          {/* Add milestone */}
          <form onSubmit={handleAddMilestone} className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-muted shrink-0" />
            <input
              type="text"
              value={milestoneTitle}
              onChange={e => setMilestoneTitle(e.target.value)}
              placeholder="Add milestone..."
              disabled={addingMilestone}
              className="flex-1 px-2 py-1.5 bg-transparent text-sm text-primary placeholder-muted focus:outline-none"
            />
            {milestoneTitle && (
              <DatePicker
                value={milestoneDueDate || null}
                onChange={setMilestoneDueDate}
                placeholder="Due"
                className="w-28"
              />
            )}
            {milestoneTitle && (
              <button type="submit" disabled={addingMilestone} className="px-2 py-1 bg-secondary text-white text-xs rounded-md hover:bg-secondary/90">Add</button>
            )}
          </form>

          {completedMilestones.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted cursor-pointer hover:text-primary">
                {completedMilestones.length} completed milestone{completedMilestones.length !== 1 ? 's' : ''}
              </summary>
              <div className="space-y-2 mt-2">
                {completedMilestones.map(milestone => {
                  const mTasks = tasksByMilestone[milestone.id] || []
                  const mDone = mTasks.filter(t => t.status === 'completed').length
                  return (
                    <MilestoneRow
                      key={milestone.id}
                      milestone={milestone}
                      taskCount={mTasks.length}
                      doneCount={mDone}
                      onToggle={handleToggleMilestone}
                      onTitleBlur={handleMilestoneTitleBlur}
                      onDateChange={handleMilestoneDateChange}
                      onDelete={handleDeleteMilestone}
                    />
                  )
                })}
              </div>
            </details>
          )}
        </div>

        {/* Tasks grouped by milestone */}
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Tasks</h4>

          {/* Tasks with milestones */}
          {[...pendingMilestones, ...completedMilestones].map(milestone => {
            const mTasks = tasksByMilestone[milestone.id] || []
            if (mTasks.length === 0) return null
            return (
              <div key={milestone.id} className="mb-4">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  {milestone.title}
                </p>
                <div className="space-y-1 pl-1">
                  {mTasks.map(task => (
                    <TaskRow key={task.id} task={task} onToggle={handleToggleTask} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Ungrouped tasks */}
          {(tasksByMilestone[''] || []).length > 0 && (
            <div className="mb-4">
              {milestones.length > 0 && (
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">No milestone</p>
              )}
              <div className="space-y-1 pl-1">
                {(tasksByMilestone[''] || []).map(task => (
                  <TaskRow key={task.id} task={task} onToggle={handleToggleTask} />
                ))}
              </div>
            </div>
          )}

          {/* Quick add task */}
          <form onSubmit={handleQuickAddTask} className="flex items-center gap-2 mt-3">
            <Plus className="w-4 h-4 text-muted shrink-0" />
            <input
              type="text"
              value={quickTaskTitle}
              onChange={e => setQuickTaskTitle(e.target.value)}
              placeholder="Add a task..."
              disabled={addingTask}
              className="flex-1 px-2 py-1.5 bg-transparent text-sm text-primary placeholder-muted focus:outline-none"
            />
            {quickTaskTitle && milestones.length > 0 && (
              <select
                value={taskMilestoneId}
                onChange={e => setTaskMilestoneId(e.target.value)}
                className="px-2 py-1 bg-surface border border-border rounded text-xs text-primary"
              >
                <option value="">No milestone</option>
                {pendingMilestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            )}
          </form>
        </div>

        {/* Delete */}
        <div className="pt-4 border-t border-border">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600 flex-1">Delete this project and unlink all tasks?</p>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm text-primary border border-border rounded-lg hover:bg-primary-5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete project
            </button>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (task: Task) => void }) {
  const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59')) && task.status !== 'completed'
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary-5 group">
      <button onClick={() => onToggle(task)} className="shrink-0">
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <Circle className="w-4 h-4 text-muted hover:text-emerald-600 transition-colors" />
        )}
      </button>
      <span className={`text-sm flex-1 ${task.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
        {task.title}
      </span>
      {task.due_date && (
        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted'}`}>
          {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
        </span>
      )}
    </div>
  )
}

function MilestoneRow({
  milestone,
  taskCount,
  doneCount,
  onToggle,
  onTitleBlur,
  onDateChange,
  onDelete,
}: {
  milestone: ProjectMilestone
  taskCount: number
  doneCount: number
  onToggle: (m: ProjectMilestone) => void
  onTitleBlur: (m: ProjectMilestone, title: string) => void
  onDateChange: (m: ProjectMilestone, date: string) => void
  onDelete: (m: ProjectMilestone) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(milestone.title)
  const completed = milestone.status === 'completed'
  const overdue = milestone.due_date && isAfter(new Date(), new Date(milestone.due_date + 'T23:59:59')) && !completed

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary-5 group">
      <button onClick={() => onToggle(milestone)} className="shrink-0">
        {completed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <Circle className="w-4 h-4 text-muted hover:text-emerald-600 transition-colors" />
        )}
      </button>
      {editing ? (
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => { setEditing(false); onTitleBlur(milestone, title) }}
          onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onTitleBlur(milestone, title) } }}
          className="flex-1 text-sm bg-transparent border-b border-secondary outline-none text-primary"
          autoFocus
        />
      ) : (
        <span
          className={`text-sm flex-1 cursor-pointer ${completed ? 'text-muted line-through' : 'text-primary'}`}
          onClick={() => setEditing(true)}
        >
          {milestone.title}
        </span>
      )}
      {taskCount > 0 && (
        <span className="text-xs text-muted">{doneCount}/{taskCount}</span>
      )}
      {milestone.due_date && (
        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted'}`}>
          {format(new Date(milestone.due_date + 'T12:00:00'), 'MMM d')}
        </span>
      )}
      <button
        onClick={() => onDelete(milestone)}
        className="shrink-0 text-muted hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
