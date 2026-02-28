'use client'

import { useState } from 'react'
import { format, isAfter } from 'date-fns'
import { Circle, CheckCircle2, Flag, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Task } from '@/types/database'
import { SlideOver } from '@/components/ui/slide-over'
import { updateTaskStatus, completeRecurringTask } from '../tasks/actions'

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

const priorityLabels: Record<number, string> = { 1: 'P1 – Urgent', 2: 'P2 – High', 3: 'P3 – Medium', 4: 'P4 – Low' }

interface DashboardTaskDetailProps {
  task: Task
  clientMap: Record<string, string>
  open: boolean
  onClose: () => void
  onToggle: (task: Task) => void
}

export function DashboardTaskDetail({ task, clientMap, open, onClose, onToggle }: DashboardTaskDetailProps) {
  const overdue = task.due_date && isAfter(new Date(), new Date(task.due_date + 'T23:59:59'))
  const company = task.client_id ? clientMap[task.client_id] : null

  return (
    <SlideOver open={open} onClose={onClose} title="Task Details">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <button onClick={() => onToggle(task)} className="shrink-0 mt-1">
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <Circle className="w-6 h-6 text-muted hover:text-emerald-600 transition-colors" />
            )}
          </button>
          <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'text-muted line-through' : 'text-primary'}`}>
            {task.title}
          </h3>
        </div>

        {task.description && (
          <div>
            <p className="text-xs text-muted uppercase font-medium mb-1">Description</p>
            <p className="text-sm text-primary/80 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted uppercase font-medium mb-1">Priority</p>
            <div className="flex items-center gap-2">
              <Flag className={`w-4 h-4 ${priorityColors[task.priority_level] || priorityColors[4]}`} />
              <span className="text-sm text-primary">{priorityLabels[task.priority_level] || 'P4 – Low'}</span>
            </div>
          </div>
          {task.due_date && (
            <div>
              <p className="text-xs text-muted uppercase font-medium mb-1">Due Date</p>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${overdue ? 'text-red-500' : 'text-muted'}`} />
                <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-primary'}`}>
                  {format(new Date(task.due_date + 'T12:00:00'), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}
        </div>

        {company && (
          <div>
            <p className="text-xs text-muted uppercase font-medium mb-1">Company</p>
            <Link
              href={`/clients/${task.client_id}`}
              className="text-sm text-secondary hover:underline"
            >
              {company}
            </Link>
          </div>
        )}

        {task.is_recurring && (
          <div>
            <p className="text-xs text-muted uppercase font-medium mb-1">Recurrence</p>
            <span className="text-sm text-primary capitalize">{task.recurrence_rule || 'Daily'}</span>
          </div>
        )}
      </div>
    </SlideOver>
  )
}
