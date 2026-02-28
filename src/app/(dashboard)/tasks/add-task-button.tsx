'use client'

import { useState } from 'react'
import { Plus, X, Flag } from 'lucide-react'
import { Client, TaskSection, TaskLabel, ClientProject } from '@/types/database'
import { createTask } from './actions'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'

interface AddTaskButtonProps {
  clients: Client[]
  projects?: ClientProject[]
  sections: TaskSection[]
  labels: TaskLabel[]
  onTaskCreated?: () => void
}

const priorities = [
  { level: 1, label: 'P1', color: 'text-red-500' },
  { level: 2, label: 'P2', color: 'text-orange-500' },
  { level: 3, label: 'P3', color: 'text-yellow-500' },
  { level: 4, label: 'P4', color: 'text-gray-400' },
]

export function AddTaskButton({ clients, projects = [], sections, onTaskCreated }: AddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priorityLevel, setPriorityLevel] = useState(4)
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const priorityMap: Record<number, string> = { 1: 'high', 2: 'high', 3: 'medium', 4: 'low' }

    const result = await createTask({
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      due_date: dueDate || null,
      due_time: formData.get('due_time') as string || null,
      priority: priorityMap[priorityLevel] || 'medium',
      priority_level: priorityLevel,
      client_id: formData.get('client_id') as string || null,
      project_id: formData.get('project_id') as string || null,
      section_id: formData.get('section_id') as string || null,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? formData.get('recurrence_rule') as string || 'daily' : null,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setIsOpen(false)
    setLoading(false)
    setPriorityLevel(4)
    setIsRecurring(false)
    setDueDate('')
    toast.success('Task created')
    onTaskCreated?.()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">Add New Task</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  placeholder="Follow up on Q2 goals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
                  placeholder="Details about this task..."
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Priority</label>
                <div className="flex items-center gap-2">
                  {priorities.map(p => (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => setPriorityLevel(p.level)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        priorityLevel === p.level
                          ? 'border-secondary bg-secondary-10'
                          : 'border-border hover:border-border-strong'
                      }`}
                    >
                      <Flag className={`w-3.5 h-3.5 ${p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Due Date</label>
                  <DatePicker value={dueDate || null} onChange={setDueDate} placeholder="Set due date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Due Time</label>
                  <input
                    name="due_time"
                    type="time"
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Section</label>
                  <select
                    name="section_id"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  >
                    <option value="">Inbox</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Company</label>
                  <select
                    name="client_id"
                    defaultValue=""
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  >
                    <option value="">No company</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                    ))}
                  </select>
                </div>
                {projects.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-primary mb-1.5">Project</label>
                    <select
                      name="project_id"
                      className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                    >
                      <option value="">No project</option>
                      {projects.filter(p => p.client_id === selectedClientId).map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-border-strong"
                  />
                  <span className="text-primary font-medium">Recurring</span>
                </label>
                {isRecurring && (
                  <select
                    name="recurrence_rule"
                    defaultValue="daily"
                    className="px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
