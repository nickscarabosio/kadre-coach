'use client'

import { useState, useEffect } from 'react'
import { format, isAfter } from 'date-fns'
import {
  Circle,
  CheckCircle2,
  Calendar,
  Flag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
import { createClient } from '@/lib/supabase/client'
import type { Task, ProjectMilestone } from '@/types/database'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardProjectDetailProps {
  project: {
    id: string
    client_id: string
    title: string
    description?: string | null
    due_date?: string | null
    status: string
    company_name: string
    created_at: string
  }
  open: boolean
  onClose: () => void
}

const projectStatusLabels: Record<string, string> = {
  active: 'On-Track',
  off_track: 'Off-Track',
  needs_attention: 'Needs Attention',
  completed: 'Completed',
  idea: 'Idea',
  planning: 'Planning',
  on_hold: 'On Hold',
}

const statusColorClasses: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  off_track: 'bg-red-50 text-red-700 border-red-200',
  needs_attention: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-secondary-10 text-secondary border-secondary-20',
  idea: 'bg-primary-5 text-muted border-border',
  planning: 'bg-blue-50 text-blue-700 border-blue-200',
  on_hold: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function DashboardProjectDetail({ project, open, onClose }: DashboardProjectDetailProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      async function loadDetails() {
        setLoading(true)
        const supabase = createClient()
        
        const [tasksRes, milestonesRes] = await Promise.all([
          supabase.from('tasks').select('*').eq('project_id', project.id).order('sort_order'),
          supabase.from('project_milestones').select('*').eq('project_id', project.id).order('sort_order')
        ])
        
        if (tasksRes.data) setTasks(tasksRes.data)
        if (milestonesRes.data) setMilestones(milestonesRes.data)
        setLoading(false)
      }
      loadDetails()
    }
  }, [open, project.id])

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const isOverdue = project.due_date && isAfter(new Date(), new Date(project.due_date + 'T23:59:59'))

  return (
    <SlideOver open={open} onClose={onClose} title="Project Details" width="max-w-xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-primary">{project.title}</h3>
          <p className="text-sm text-muted mt-1">{project.company_name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Status</label>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border inline-block ${statusColorClasses[project.status] || statusColorClasses.active}`}>
              {projectStatusLabels[project.status] || projectStatusLabels.active}
            </span>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Due Date</label>
            <div className="flex items-center gap-2 text-sm text-primary">
              <Calendar className="w-4 h-4 text-muted" />
              {project.due_date ? format(new Date(project.due_date + 'T12:00:00'), 'MMM d, yyyy') : 'No due date'}
            </div>
          </div>
          {isOverdue && project.status !== 'completed' && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-semibold uppercase tracking-wider rounded-full border border-red-100">Overdue</span>
          )}
        </div>

        {project.description && (
          <div>
            <label className="block text-xs text-muted mb-1">Description</label>
            <p className="text-sm text-primary/80 leading-relaxed">{project.description}</p>
          </div>
        )}

        {totalTasks > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted">Progress</span>
              <span className="text-xs font-medium text-primary">{completedTasks}/{totalTasks} tasks ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-primary-5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverdue && progressPercent < 100 ? 'bg-red-500' : 'bg-secondary'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-muted text-sm">Loading tasks...</div>
        ) : (
          <>
            {milestones.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">Milestones</h4>
                <div className="space-y-2">
                  {milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary-5">
                      {m.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted" />
                      )}
                      <span className={`text-sm flex-1 ${m.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">Tasks</h4>
                <div className="space-y-1">
                  {tasks.slice(0, 10).map(t => (
                    <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                      {t.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted" />
                      )}
                      <span className={`text-sm flex-1 ${t.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                  {tasks.length > 10 && (
                    <p className="text-xs text-muted mt-2 ml-8">And {tasks.length - 10} more tasks...</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="pt-6 border-t border-border">
          <Link
            href={`/clients/${project.client_id}#section-projects`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-secondary text-white font-medium rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Go to Client Page
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </SlideOver>
  )
}
