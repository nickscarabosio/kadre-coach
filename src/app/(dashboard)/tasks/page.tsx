import { TaskBoard } from './task-board'

export const dynamic = 'force-dynamic'

export default function TasksPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <TaskBoard />
    </div>
  )
}
