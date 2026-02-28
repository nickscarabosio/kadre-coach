'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Flag, Calendar } from 'lucide-react'
import { format, isAfter } from 'date-fns'
import type { Task, Client, TaskLabel } from '@/types/database'

interface TaskKanbanProps {
  tasks: Task[]
  clients: Client[]
  labels: TaskLabel[]
  labelAssignments: { task_id: string; label_id: string }[]
  onStatusChange: (taskId: string, status: string) => void
  onTaskClick: (task: Task) => void
}

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-gray-400',
}

interface Column {
  id: string
  title: string
  status: string
  color: string
}

const columns: Column[] = [
  { id: 'pending', title: 'Upcoming', status: 'pending', color: 'bg-muted' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-secondary' },
  { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-emerald-500' },
]

export function TaskKanban({
  tasks,
  clients,
  labels,
  labelAssignments,
  onStatusChange,
  onTaskClick,
}: TaskKanbanProps) {
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]))
  const labelMap = Object.fromEntries(labels.map((l) => [l.id, l]))
  const getLabels = (taskId: string) =>
    labelAssignments
      .filter((a) => a.task_id === taskId)
      .map((a) => labelMap[a.label_id])
      .filter(Boolean)

  const tasksByStatus = (status: string) =>
    tasks
      .filter((t) => !t.parent_task_id && t.status === status)
      .sort((a, b) => a.sort_order - b.sort_order)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId
    const task = tasks.find((t) => t.id === draggableId)
    if (!task || task.status === newStatus) return
    onStatusChange(draggableId, newStatus)
  }

  const now = new Date()

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {columns.map((col) => {
          const colTasks = tasksByStatus(col.status)
          return (
            <div key={col.id} className="flex-1 min-w-[280px]">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold text-primary">{col.title}</h3>
                <span className="text-xs text-muted ml-auto">{colTasks.length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 p-2 rounded-xl min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-secondary-10'
                        : 'bg-primary-5/50'
                    }`}
                  >
                    {colTasks.map((task, index) => {
                      const client = task.client_id ? clientMap[task.client_id] : null
                      const tLabels = getLabels(task.id)
                      const overdue =
                        task.due_date &&
                        isAfter(now, new Date(task.due_date + 'T23:59:59')) &&
                        task.status !== 'completed'

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => onTaskClick(task)}
                              className={`bg-surface border border-border rounded-lg p-3 cursor-pointer hover:shadow-card transition-shadow ${
                                dragSnapshot.isDragging ? 'shadow-nav ring-2 ring-secondary/30' : ''
                              }`}
                            >
                              <p
                                className={`text-sm font-medium ${
                                  task.status === 'completed'
                                    ? 'text-muted line-through'
                                    : 'text-primary'
                                }`}
                              >
                                {task.title}
                              </p>

                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Flag
                                  className={`w-3.5 h-3.5 ${
                                    priorityColors[task.priority_level] || priorityColors[4]
                                  }`}
                                />
                                {task.due_date && (
                                  <span
                                    className={`flex items-center gap-1 text-xs ${
                                      overdue ? 'text-red-600 font-medium' : 'text-muted'
                                    }`}
                                  >
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                                  </span>
                                )}
                                {client && (
                                  <span className="text-xs text-muted bg-primary-5 px-1.5 py-0.5 rounded">
                                    {client.company_name || client.name}
                                  </span>
                                )}
                              </div>

                              {tLabels.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 flex-wrap">
                                  {tLabels.map((l) => (
                                    <span
                                      key={l.id}
                                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: l.color + '20',
                                        color: l.color,
                                      }}
                                    >
                                      {l.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
