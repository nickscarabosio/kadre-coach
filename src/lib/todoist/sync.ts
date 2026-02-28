import { SupabaseClient } from '@supabase/supabase-js'
import * as todoist from './client'

interface SyncResult {
  pushed: number
  pulled: number
  errors: string[]
}

/**
 * Full bidirectional sync for a single coach.
 * 1. Push: Kadre tasks without todoist_id → create in Todoist
 * 2. Pull: Todoist tasks not in Kadre → create in Kadre
 * 3. Reconcile: Tasks linked in both → update whichever is stale
 */
export async function syncCoachTasks(
  supabase: SupabaseClient,
  coachId: string,
  token: string
): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] }

  // Fetch all from both sides
  let todoistTasks: todoist.TodoistTask[]
  try {
    todoistTasks = await todoist.listTasks(token)
  } catch (err) {
    result.errors.push(`Failed to fetch Todoist tasks: ${err}`)
    return result
  }

  const { data: kadreTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('coach_id', coachId)

  if (!kadreTasks) return result

  const todoistById = new Map(todoistTasks.map(t => [t.id, t]))
  const kadreByTodoistId = new Map(
    kadreTasks.filter(t => t.todoist_id).map(t => [t.todoist_id!, t])
  )

  // --- PUSH: Kadre tasks without todoist_id → create in Todoist ---
  const unlinked = kadreTasks.filter(t => !t.todoist_id && t.status !== 'completed')
  for (const task of unlinked) {
    try {
      const created = await todoist.createTask(token, {
        content: task.title,
        description: task.description || undefined,
        priority: todoist.toTodoistPriority(task.priority_level),
        due_date: task.due_date || undefined,
      })

      await supabase.from('tasks').update({
        todoist_id: created.id,
        todoist_sync_at: new Date().toISOString(),
      }).eq('id', task.id)

      result.pushed++
    } catch (err) {
      result.errors.push(`Push failed for task "${task.title}": ${err}`)
    }
  }

  // --- RECONCILE: Linked tasks → sync changes ---
  for (const [todoistId, kadreTask] of kadreByTodoistId) {
    const tt = todoistById.get(todoistId)
    if (!tt) {
      // Todoist task was deleted — mark Kadre task as completed
      if (kadreTask.status !== 'completed') {
        await supabase.from('tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          todoist_sync_at: new Date().toISOString(),
        }).eq('id', kadreTask.id)
      }
      continue
    }

    // Remove from map so we don't pull it again
    todoistById.delete(todoistId)

    const kadreUpdated = new Date(kadreTask.updated_at).getTime()
    const todoistUpdated = new Date(tt.updated_at).getTime()
    const lastSync = kadreTask.todoist_sync_at
      ? new Date(kadreTask.todoist_sync_at).getTime()
      : 0

    // Todoist was completed
    if (tt.is_completed && kadreTask.status !== 'completed') {
      await supabase.from('tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        todoist_sync_at: new Date().toISOString(),
      }).eq('id', kadreTask.id)
      continue
    }

    // Kadre was completed
    if (!tt.is_completed && kadreTask.status === 'completed') {
      try {
        await todoist.closeTask(token, todoistId)
        await supabase.from('tasks').update({
          todoist_sync_at: new Date().toISOString(),
        }).eq('id', kadreTask.id)
      } catch (err) {
        result.errors.push(`Close failed for todoist ${todoistId}: ${err}`)
      }
      continue
    }

    // Kadre changed more recently → push to Todoist
    if (kadreUpdated > lastSync && kadreUpdated > todoistUpdated) {
      try {
        await todoist.updateTask(token, todoistId, {
          content: kadreTask.title,
          description: kadreTask.description || undefined,
          priority: todoist.toTodoistPriority(kadreTask.priority_level),
          due_date: kadreTask.due_date || undefined,
        })
        await supabase.from('tasks').update({
          todoist_sync_at: new Date().toISOString(),
        }).eq('id', kadreTask.id)
        result.pushed++
      } catch (err) {
        result.errors.push(`Update push failed for "${kadreTask.title}": ${err}`)
      }
    }
    // Todoist changed more recently → pull to Kadre
    else if (todoistUpdated > lastSync) {
      await supabase.from('tasks').update({
        title: tt.content,
        description: tt.description || null,
        priority_level: todoist.toKadrePriority(tt.priority),
        priority: priorityLabel(todoist.toKadrePriority(tt.priority)),
        due_date: tt.due?.date || null,
        todoist_sync_at: new Date().toISOString(),
      }).eq('id', kadreTask.id)
      result.pulled++
    }
  }

  // --- PULL: Remaining Todoist tasks not in Kadre → create ---
  for (const [, tt] of todoistById) {
    if (tt.is_completed) continue

    const kadrePriority = todoist.toKadrePriority(tt.priority)
    const { error } = await supabase.from('tasks').insert({
      coach_id: coachId,
      title: tt.content,
      description: tt.description || null,
      priority_level: kadrePriority,
      priority: priorityLabel(kadrePriority),
      due_date: tt.due?.date || null,
      todoist_id: tt.id,
      todoist_sync_at: new Date().toISOString(),
      sort_order: 0,
    })

    if (!error) result.pulled++
    else result.errors.push(`Pull failed for "${tt.content}": ${error.message}`)
  }

  return result
}

function priorityLabel(level: number): string {
  switch (level) {
    case 1: return 'urgent'
    case 2: return 'high'
    case 3: return 'medium'
    default: return 'low'
  }
}

/**
 * Push a single task to Todoist after create/update in Kadre.
 * Returns the todoist_id if created, or null.
 */
export async function pushTask(
  supabase: SupabaseClient,
  coachId: string,
  taskId: string
): Promise<string | null> {
  const { data: coach } = await supabase
    .from('coaches')
    .select('todoist_api_token, todoist_sync_enabled')
    .eq('id', coachId)
    .single()

  if (!coach?.todoist_sync_enabled || !coach.todoist_api_token) return null

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) return null

  try {
    if (task.todoist_id) {
      // Update existing
      await todoist.updateTask(coach.todoist_api_token, task.todoist_id, {
        content: task.title,
        description: task.description || undefined,
        priority: todoist.toTodoistPriority(task.priority_level),
        due_date: task.due_date || undefined,
      })
      await supabase.from('tasks').update({
        todoist_sync_at: new Date().toISOString(),
      }).eq('id', taskId)
      return task.todoist_id
    } else {
      // Create new
      const created = await todoist.createTask(coach.todoist_api_token, {
        content: task.title,
        description: task.description || undefined,
        priority: todoist.toTodoistPriority(task.priority_level),
        due_date: task.due_date || undefined,
      })
      await supabase.from('tasks').update({
        todoist_id: created.id,
        todoist_sync_at: new Date().toISOString(),
      }).eq('id', taskId)
      return created.id
    }
  } catch (err) {
    console.error(`Todoist push failed for task ${taskId}:`, err)
    return null
  }
}

/**
 * Sync task status to Todoist (complete/reopen).
 */
export async function pushTaskStatus(
  supabase: SupabaseClient,
  coachId: string,
  taskId: string,
  status: string
): Promise<void> {
  const { data: coach } = await supabase
    .from('coaches')
    .select('todoist_api_token, todoist_sync_enabled')
    .eq('id', coachId)
    .single()

  if (!coach?.todoist_sync_enabled || !coach.todoist_api_token) return

  const { data: task } = await supabase
    .from('tasks')
    .select('todoist_id')
    .eq('id', taskId)
    .single()

  if (!task?.todoist_id) return

  try {
    if (status === 'completed') {
      await todoist.closeTask(coach.todoist_api_token, task.todoist_id)
    } else {
      await todoist.reopenTask(coach.todoist_api_token, task.todoist_id)
    }
    await supabase.from('tasks').update({
      todoist_sync_at: new Date().toISOString(),
    }).eq('id', taskId)
  } catch (err) {
    console.error(`Todoist status push failed for task ${taskId}:`, err)
  }
}

/**
 * Delete a task from Todoist when deleted in Kadre.
 */
export async function pushTaskDelete(
  supabase: SupabaseClient,
  coachId: string,
  todoistId: string | null
): Promise<void> {
  if (!todoistId) return

  const { data: coach } = await supabase
    .from('coaches')
    .select('todoist_api_token, todoist_sync_enabled')
    .eq('id', coachId)
    .single()

  if (!coach?.todoist_sync_enabled || !coach.todoist_api_token) return

  try {
    await todoist.deleteTask(coach.todoist_api_token, todoistId)
  } catch (err) {
    console.error(`Todoist delete failed for ${todoistId}:`, err)
  }
}
