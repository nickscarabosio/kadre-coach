'use client'

import { useState } from 'react'
import { Task, Client, TaskSection, TaskLabel } from '@/types/database'
import { Flag, Trash2, RefreshCw } from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
import { updateTask, deleteTask } from './actions'

interface TaskDetailPanelProps {
  task: Task
  clients: Client[]
  sections: TaskSection[]
  labels: TaskLabel[]
  taskLabelIds: string[]
  subtasks: Task[]
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, data: Partial<Task>) => void
  onDelete: (taskId: string) => void
}

const priorityOptions = [
  { level: 1, label: 'P1 — Urgent', color: 'text-red-500' },
  { level: 2, label: 'P2 — High', color: 'text-orange-500' },
  { level: 3, label: 'P3 — Medium', color: 'text-yellow-500' },
  { level: 4, label: 'P4 — Low', color: 'text-gray-400' },
]

export function TaskDetailPanel({
  task, clients, sections, labels, taskLabelIds, subtasks,
  open, onClose, onUpdate, onDelete,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [deleting, setDeleting] = useState(false)

  const saveField = (field: string, value: unknown) => {
    onUpdate(task.id, { [field]: value } as Partial<Task>)
    updateTask(task.id, { [field]: value })
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      saveField('title', title)
    }
  }

  const handleDescBlur = () => {
    if (description !== (task.description || '')) {
      saveField('description', description || null)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    onDelete(task.id)
    await deleteTask(task.id)
    onClose()
  }

  return (
    <SlideOver open={open} onClose={onClose} title="Task Details" width="max-w-lg">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            rows={3}
            className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
            placeholder="Add a description..."
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase mb-1">Priority</label>
          <div className="flex items-center gap-2">
            {priorityOptions.map(p => (
              <button
                key={p.level}
                onClick={() => {
                  const priorityMap: Record<number, string> = { 1: 'high', 2: 'high', 3: 'medium', 4: 'low' }
                  onUpdate(task.id, { priority_level: p.level, priority: priorityMap[p.level] } as Partial<Task>)
                  updateTask(task.id, { priority_level: p.level, priority: priorityMap[p.level] })
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  task.priority_level === p.level ? 'border-secondary bg-secondary-10' : 'border-border hover:border-border-strong'
                }`}
              >
                <Flag className={`w-3 h-3 ${p.color}`} />
                P{p.level}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-1">Due Date</label>
            <input
              type="date"
              value={task.due_date || ''}
              onChange={(e) => saveField('due_date', e.target.value || null)}
              className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            />
          </div>

          {/* Due Time */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-1">Due Time</label>
            <input
              type="time"
              value={task.due_time || ''}
              onChange={(e) => saveField('due_time', e.target.value || null)}
              className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-1">Section</label>
            <select
              value={task.section_id || ''}
              onChange={(e) => saveField('section_id', e.target.value || null)}
              className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            >
              <option value="">Inbox</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-1">Company</label>
            <select
              value={task.client_id || ''}
              onChange={(e) => saveField('client_id', e.target.value || null)}
              className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            >
              <option value="">None</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recurring */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={task.is_recurring}
              onChange={(e) => saveField('is_recurring', e.target.checked)}
              className="rounded border-border-strong"
            />
            <RefreshCw className="w-3.5 h-3.5 text-muted" />
            <span className="text-primary font-medium">Recurring</span>
          </label>
          {task.is_recurring && (
            <select
              value={task.recurrence_rule || 'daily'}
              onChange={(e) => saveField('recurrence_rule', e.target.value)}
              className="px-2 py-1 bg-surface border border-border-strong rounded-lg text-xs text-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          )}
        </div>

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-2">Subtasks</label>
            <div className="space-y-1">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 px-2 py-1 bg-primary-5 rounded">
                  <span className={`text-sm ${sub.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors w-full justify-center"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </SlideOver>
  )
}
