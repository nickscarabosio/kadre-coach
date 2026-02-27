'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, Trash2, GripVertical } from 'lucide-react'
import type { ClientProject } from '@/types/database'
import { createProject, updateProject, deleteProject } from './project-actions'

interface ProjectBoardProps {
  clientId: string
  projects: ClientProject[]
}

const columns = [
  { status: 'idea', label: 'Idea', color: 'border-primary-20' },
  { status: 'planning', label: 'Planning', color: 'border-amber-400' },
  { status: 'active', label: 'In Progress', color: 'border-secondary' },
  { status: 'completed', label: 'Completed', color: 'border-emerald-500' },
]

export function ProjectBoard({ clientId, projects: initialProjects }: ProjectBoardProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingStatus, setAddingStatus] = useState('active')
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    await createProject(clientId, { title: name, description: description || null, status: addingStatus })
    setShowAddModal(false)
    setSaving(false)
    // Refetch via optimistic approach
    const optimistic: ClientProject = {
      id: crypto.randomUUID(),
      client_id: clientId,
      coach_id: '',
      title: name,
      description: description || null,
      status: addingStatus,
      sort_order: projects.length,
      assigned_to: null,
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setProjects(prev => [...prev, optimistic])
  }

  const handleStatusChange = async (project: ClientProject, newStatus: string) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p))
    await updateProject(project.id, clientId, { status: newStatus })
  }

  const handleDelete = async (project: ClientProject) => {
    setProjects(prev => prev.filter(p => p.id !== project.id))
    await deleteProject(project.id, clientId)
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
                {colProjects.map(project => (
                  <div
                    key={project.id}
                    className="bg-surface border border-border rounded-lg p-3 shadow-subtle group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/clients/${clientId}/projects/${project.id}`} className="block">
                          <p className="text-sm font-medium text-primary hover:text-secondary">{project.title}</p>
                        </Link>
                        {project.description && (
                          <p className="text-xs text-muted mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                    </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          onClick={() => handleDelete(project)}
                          className="p-0.5 text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                  </div>
                ))}
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
    </>
  )
}
