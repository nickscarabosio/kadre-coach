'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import { Plus, X, Trash2, GripVertical, Calendar } from 'lucide-react'
import type { ClientProject, Task, ProjectMilestone } from '@/types/database'
import { createProject, updateProject, deleteProject } from './project-actions'
import { ProjectDetailPanel } from './project-detail-panel'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'

interface ProjectBoardProps {
  clientId: string
  projects: ClientProject[]
  projectTasks: Task[]
  milestones: ProjectMilestone[]
}

const columns = [
  { status: 'idea', label: 'Idea', color: 'border-primary-20' },
  { status: 'planning', label: 'Planning', color: 'border-amber-400' },
  { status: 'active', label: 'In Progress', color: 'border-secondary' },
  { status: 'completed', label: 'Completed', color: 'border-emerald-500' },
]

export function ProjectBoard({ clientId, projects: initialProjects, projectTasks: initialTasks, milestones: initialMilestones }: ProjectBoardProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [tasks, setTasks] = useState(initialTasks)
  const [milestones, setMilestones] = useState(initialMilestones)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingStatus, setAddingStatus] = useState('active')
  const [saving, setSaving] = useState(false)
  const [detailProject, setDetailProject] = useState<ClientProject | null>(null)
  const [addDueDate, setAddDueDate] = useState('')

  const tasksByProject: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (t.project_id) {
      if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = []
      tasksByProject[t.project_id].push(t)
    }
  }

  const milestonesByProject: Record<string, ProjectMilestone[]> = {}
  for (const m of milestones) {
    if (!milestonesByProject[m.project_id]) milestonesByProject[m.project_id] = []
    milestonesByProject[m.project_id].push(m)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    await createProject(clientId, {
      title: name,
      description: description || null,
      status: addingStatus,
      due_date: addDueDate || undefined,
    })
    const optimistic: ClientProject = {
      id: crypto.randomUUID(),
      client_id: clientId,
      coach_id: '',
      title: name,
      description: description || null,
      status: addingStatus,
      sort_order: projects.length,
      assigned_to: null,
      due_date: addDueDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setProjects(prev => [...prev, optimistic])
    setShowAddModal(false)
    setSaving(false)
    setAddDueDate('')
    toast.success('Project created')
    // Open slide-over for the new project
    setDetailProject(optimistic)
  }

  const handleStatusChange = async (project: ClientProject, newStatus: string) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p))
    await updateProject(project.id, clientId, { status: newStatus })
  }

  const handleDelete = async (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    setTasks(prev => prev.filter(t => t.project_id !== projectId))
    setMilestones(prev => prev.filter(m => m.project_id !== projectId))
    await deleteProject(projectId, clientId)
  }

  const handleProjectUpdate = (projectId: string, data: Partial<ClientProject>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p))
    if (detailProject?.id === projectId) {
      setDetailProject(prev => prev ? { ...prev, ...data } as ClientProject : prev)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colProjects = projects.filter(p =>
            col.status === 'planning' ? (p.status === 'planning' || p.status === 'on_hold') : p.status === col.status
          )
          return (
            <div key={col.status} className={`border-t-2 ${col.color} bg-primary-5 rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-primary">{col.label}</h3>
                <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{colProjects.length}</span>
              </div>
              <div className="space-y-2">
                {colProjects.map(project => {
                  const pTasks = tasksByProject[project.id] || []
                  const completedCount = pTasks.filter(t => t.status === 'completed').length
                  const totalCount = pTasks.length
                  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                  const isOverdue = project.due_date && isAfter(new Date(), new Date(project.due_date + 'T23:59:59')) && project.status !== 'completed'
                  const pMilestones = (milestonesByProject[project.id] || []).filter(m => m.status !== 'completed')
                  const nextMilestone = pMilestones.sort((a, b) => {
                    if (!a.due_date) return 1
                    if (!b.due_date) return -1
                    return a.due_date.localeCompare(b.due_date)
                  })[0]

                  return (
                    <div
                      key={project.id}
                      className="bg-surface border border-border rounded-lg p-3 shadow-subtle group cursor-pointer hover:border-secondary/30 transition-colors"
                      onClick={() => setDetailProject(project)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted shrink-0 mt-0.5 sm:opacity-0 sm:group-hover:opacity-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary">{project.title}</p>
                          {project.description && (
                            <p className="text-xs text-muted mt-1 line-clamp-2">{project.description}</p>
                          )}
                          {/* Due date */}
                          {project.due_date && (
                            <p className={`flex items-center gap-1 text-xs mt-1.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted'}`}>
                              <Calendar className="w-3 h-3" />
                              {format(new Date(project.due_date + 'T12:00:00'), 'MMM d')}
                              {isOverdue && <span className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-[10px]">Overdue</span>}
                            </p>
                          )}
                          {/* Progress bar */}
                          {totalCount > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-primary-5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isOverdue && progressPercent < 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted font-medium">{completedCount}/{totalCount}</span>
                            </div>
                          )}
                          {/* Next milestone */}
                          {nextMilestone && (
                            <p className="text-[10px] text-muted mt-1.5 truncate">
                              Next: {nextMilestone.title}
                              {nextMilestone.due_date && ` · ${format(new Date(nextMilestone.due_date + 'T12:00:00'), 'MMM d')}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-2" onClick={e => e.stopPropagation()}>
                        <select
                          value={project.status}
                          onChange={(e) => handleStatusChange(project, e.target.value)}
                          className="text-[10px] bg-transparent border border-border rounded px-1 py-0.5 text-muted"
                        >
                          {columns.map(c => (
                            <option key={c.status} value={c.status}>{c.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-0.5 text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => { setAddingStatus(col.status); setShowAddModal(true) }}
                className="mt-2 w-full flex items-center justify-center gap-1 py-2 text-xs text-muted hover:text-primary hover:bg-surface rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add project
              </button>
            </div>
          )
        })}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm p-6 mx-4 shadow-nav">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">Add Project</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="Project name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                  placeholder="Brief description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Due Date</label>
                <DatePicker value={addDueDate || null} onChange={setAddDueDate} placeholder="Select due date" />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddDueDate('') }}
                  className="flex-1 px-4 py-2.5 bg-primary-5 hover:bg-primary-10 text-primary font-medium rounded-lg transition-colors border border-border-strong"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Slide-Over */}
      {detailProject && (
        <ProjectDetailPanel
          project={detailProject}
          clientId={clientId}
          tasks={tasksByProject[detailProject.id] || []}
          milestones={milestonesByProject[detailProject.id] || []}
          open={!!detailProject}
          onClose={() => setDetailProject(null)}
          onUpdate={handleProjectUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
