'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(data: {
  title: string
  description?: string | null
  due_date?: string | null
  due_time?: string | null
  priority: string
  priority_level: number
  client_id?: string | null
  section_id?: string | null
  parent_task_id?: string | null
  is_recurring?: boolean
  recurrence_rule?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get max sort_order for the section
  const query = supabase
    .from('tasks')
    .select('sort_order')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (data.section_id) {
    query.eq('section_id', data.section_id)
  } else {
    query.is('section_id', null)
  }

  const { data: lastTask } = await query

  const { error } = await supabase.from('tasks').insert({
    coach_id: user.id,
    title: data.title,
    description: data.description || null,
    due_date: data.due_date || null,
    due_time: data.due_time || null,
    priority: data.priority,
    priority_level: data.priority_level,
    client_id: data.client_id || null,
    section_id: data.section_id || null,
    parent_task_id: data.parent_task_id || null,
    is_recurring: data.is_recurring || false,
    recurrence_rule: data.recurrence_rule || null,
    sort_order: (lastTask?.[0]?.sort_order ?? -1) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateTask(taskId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('tasks')
    .update(data)
    .eq('id', taskId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const updateData: Record<string, unknown> = { status }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else {
    updateData.completed_at = null
  }

  const { error } = await supabase.from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function reorderTask(taskId: string, newSortOrder: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('tasks')
    .update({ sort_order: newSortOrder })
    .eq('id', taskId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createSection(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: lastSection } = await supabase
    .from('task_sections')
    .select('sort_order')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const { error } = await supabase.from('task_sections').insert({
    coach_id: user.id,
    name,
    sort_order: (lastSection?.[0]?.sort_order ?? -1) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSection(sectionId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('task_sections')
    .update({ name })
    .eq('id', sectionId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSection(sectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Move tasks in this section to inbox (null section)
  await supabase.from('tasks')
    .update({ section_id: null })
    .eq('section_id', sectionId)
    .eq('coach_id', user.id)

  const { error } = await supabase.from('task_sections')
    .delete()
    .eq('id', sectionId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createLabel(name: string, color: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('task_labels').insert({
    coach_id: user.id,
    name,
    color,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteLabel(labelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('task_labels')
    .delete()
    .eq('id', labelId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleLabel(taskId: string, labelId: string, add: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  if (add) {
    const { error } = await supabase.from('task_label_assignments')
      .insert({ task_id: taskId, label_id: labelId })
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('task_label_assignments')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId)
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeRecurringTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get the task
  const { data: task } = await supabase.from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('coach_id', user.id)
    .single()

  if (!task) return { error: 'Task not found' }

  // Mark current as completed
  await supabase.from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)

  // Create next instance if recurring
  if (task.is_recurring && task.due_date) {
    const nextDate = new Date(task.due_date)
    // Simple daily/weekly recurrence based on rule
    if (task.recurrence_rule === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7)
    } else {
      nextDate.setDate(nextDate.getDate() + 1) // default daily
    }

    await supabase.from('tasks').insert({
      coach_id: user.id,
      title: task.title,
      description: task.description,
      due_date: nextDate.toISOString().split('T')[0],
      due_time: task.due_time,
      priority: task.priority,
      priority_level: task.priority_level,
      client_id: task.client_id,
      section_id: task.section_id,
      is_recurring: true,
      recurrence_rule: task.recurrence_rule,
      sort_order: task.sort_order,
    })
  }

  revalidatePath('/dashboard')
  return { success: true }
}
