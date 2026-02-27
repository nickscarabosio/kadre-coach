'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import { Circle, CheckCircle2, Tag, Clock, Flag, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import type { Task } from '@/types/database'
import { updateTaskStatus, completeRecurringTask } from '../tasks/actions'

interface DashboardUpdate {
  id: string
  content: string
  voice_transcript: string | null
  message_type: string
  client_id: string | null
  classification: string | null
  created_at: string
}

interface DashboardReflection {
  id: string
  energy_level: number
  accountability_score: number
  goal_progress: string
  company_name: string
}

interface ActiveProject {
  id: string
  client_id: string
  title: string
  due_date: string | null
  company_name: string
}

interface DashboardClientProps {
  updates: DashboardUpdate[]
  tasks: Task[]
  reflections: DashboardReflection[]
  clientMap: Record<string, string>
  coachName: string | null
  activeProjects?: ActiveProject[]
}

const classColors: Record<string, string> = {
  progress: 'bg-emerald-50 text-emerald-700',
  blocker: 'bg-red-50 text-red-700',
  communication: 'bg-blue-50 text-blue-700',
  insight: 'bg-purple-50 text-purple-700',
  admin: 'bg-primary-5 text-muted',
}

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

export function DashboardClient({ updates, tasks: initialTasks, reflections, clientMap, coachName, activeProjects = [] }: DashboardClientProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const handleToggleTask = async (task: Task) => {
    if (task.is_recurring && task.status !== 'completed') {
      setTasks(prev => prev.filter(t => t.id !== task.id))
      await completeRecurringTask(task.id)
    } else {
      const next = task.status === 'completed' ? 'pending' : 'completed'
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
      await updateTaskStatus(task.id, next)
    }
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">
          Welcome back{coachName ? `, ${coachName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted mt-1">Here&apos;s what&apos;s happening with your companies</p>
      </div>

      {/* Active projects */}
      {activeProjects.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            Active projects
          </h2>
          <div className="flex flex-wrap gap-3">
            {activeProjects.map((project) => (
              <Link
                key={project.id}
                href={`/clients/${project.client_id}#projects`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-5 hover:bg-primary-10 border border-border text-sm text-primary transition-colors"
              >
                <span className="font-medium">{project.title}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{project.company_name}</span>
                {project.due_date && (
                  <>
                    <span className="text-muted">·</span>
                    <span className="text-muted">
                      {format(new Date(project.due_date + 'T12:00:00'), 'MMM d')}
                    </span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Updates (Last 24h) */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Recent Updates (Last 24h)</h2>
            <Link href="/updates" className="text-sm text-secondary hover:text-secondary/80">View all</Link>
          </div>
          {updates.length > 0 ? (
            <div className="space-y-3">
              {updates.slice(0, 5).map((update) => {
                const company = update.client_id ? clientMap[update.client_id] : null
                const displayText = update.message_type === 'voice' && update.voice_transcript
                  ? update.voice_transcript
                  : update.content
                return (
                  <div key={update.id} className="py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      {company && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-10 px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3" />
                          {company}
                        </span>
                      )}
                      {update.classification && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classColors[update.classification] || 'bg-primary-5 text-muted'}`}>
                          {update.classification}
                        </span>
                      )}
                      <span className="text-xs text-muted ml-auto">
                        {format(new Date(update.created_at), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-primary/80 line-clamp-2">{displayText}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted text-sm">No updates in the last 24 hours</p>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-primary mb-4">Recent Check-ins</h2>
          {reflections.length > 0 ? (
            <div className="space-y-3">
              {reflections.map((reflection) => (
                <div key={reflection.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-primary font-medium">
                      {reflection.company_name || 'Client Check-in'}
                    </p>
                    <p className="text-sm text-muted">
                      Energy: {reflection.energy_level}/10 · Accountability: {reflection.accountability_score}/10
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    reflection.goal_progress === 'yes'
                      ? 'bg-emerald-50 text-emerald-700'
                      : reflection.goal_progress === 'partial'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {reflection.goal_progress === 'yes' ? 'On track' : reflection.goal_progress === 'partial' ? 'Partial' : 'Off track'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No recent check-ins yet</p>
          )}
        </div>

        {/* In the next 48 hours */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">In the next 48 hours</h2>
            <Link href="/tasks" className="text-sm text-secondary hover:text-secondary/80">View all tasks</Link>
          </div>
          {activeTasks.length > 0 ? (
            <div className="space-y-3">
              {activeTasks.map((task) => {
                const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59'))
                return (
                  <div key={task.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
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
    </div>
  )
}
