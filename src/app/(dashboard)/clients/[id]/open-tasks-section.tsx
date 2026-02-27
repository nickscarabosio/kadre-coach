'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { CheckSquare, Plus } from 'lucide-react'
import type { Task } from '@/types/database'

interface OpenTasksSectionProps {
  clientId: string
  tasks: Task[]
}

export function OpenTasksSection({ clientId, tasks }: OpenTasksSectionProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Next Steps
          </h2>
          <Link
            href={`/tasks?client=${clientId}`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary-10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </Link>
        </div>
        <p className="text-sm text-muted">No open tasks. Add a task to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Next Steps
        </h2>
        <Link
          href={`/tasks?client=${clientId}`}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary-10 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add task
        </Link>
      </div>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link
              href="/tasks"
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-primary-5 transition-colors group"
            >
              <span className="text-sm text-primary group-hover:text-secondary">{task.title}</span>
              {task.due_date && (
                <span className="text-xs text-muted">
                  {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
