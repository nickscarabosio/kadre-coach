'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function enrollCompany(programId: string, clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('enrollments').insert({
    client_id: clientId,
    program_id: programId,
  })

  if (error) return { error: error.message }

  revalidatePath(`/programs/${programId}`)
  return { success: true }
}

export async function updateProgram(programId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('programs').update({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    duration_weeks: parseInt(formData.get('duration_weeks') as string) || 12,
  }).eq('id', programId).eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/programs/${programId}`)
  return { success: true }
}

export async function deleteProgram(programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('programs')
    .delete()
    .eq('id', programId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  redirect('/programs')
}

// ---- Phase CRUD ----

export async function createPhase(programId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get max order_index
  const { data: existing } = await supabase
    .from('program_phases')
    .select('order_index')
    .eq('program_id', programId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

  const { data, error } = await supabase.from('program_phases').insert({
    program_id: programId,
    name,
    order_index: nextOrder,
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath(`/programs/${programId}`)
  return { success: true, data }
}

export async function updatePhase(phaseId: string, data: { name?: string; description?: string; duration_value?: number; duration_unit?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('program_phases').update(data).eq('id', phaseId)
  if (error) return { error: error.message }

  revalidatePath('/programs')
  return { success: true }
}

export async function deletePhase(phaseId: string, programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('program_phases').delete().eq('id', phaseId)
  if (error) return { error: error.message }

  revalidatePath(`/programs/${programId}`)
  return { success: true }
}

export async function reorderPhases(programId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('program_phases').update({ order_index: i }).eq('id', orderedIds[i])
  }

  revalidatePath(`/programs/${programId}`)
  return { success: true }
}

// ---- Assignment CRUD ----

export async function createProgramAssignment(phaseId: string, data: {
  title: string
  description?: string
  assignment_type?: string
  response_type?: string
  recurrence_pattern?: string
  video_url?: string
  resource_url?: string
  resource_name?: string
  delay_days?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('program_assignments')
    .select('order_index')
    .eq('phase_id', phaseId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

  const { data: assignment, error } = await supabase.from('program_assignments').insert({
    phase_id: phaseId,
    coach_id: user.id,
    title: data.title,
    description: data.description || null,
    assignment_type: data.assignment_type || 'task',
    response_type: data.response_type || 'text',
    recurrence_pattern: data.recurrence_pattern || 'once',
    video_url: data.video_url || null,
    resource_url: data.resource_url || null,
    resource_name: data.resource_name || null,
    delay_days: data.delay_days || 0,
    order_index: nextOrder,
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/programs')
  return { success: true, data: assignment }
}

export async function updateProgramAssignment(assignmentId: string, data: {
  title?: string
  description?: string
  assignment_type?: string
  response_type?: string
  recurrence_pattern?: string
  video_url?: string
  resource_url?: string
  resource_name?: string
  delay_days?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('program_assignments').update(data).eq('id', assignmentId).eq('coach_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/programs')
  return { success: true }
}

export async function deleteProgramAssignment(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('program_assignments').delete().eq('id', assignmentId).eq('coach_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/programs')
  return { success: true }
}

export async function reorderAssignments(phaseId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('program_assignments').update({ order_index: i }).eq('id', orderedIds[i])
  }

  revalidatePath('/programs')
  return { success: true }
}

// ---- Assign program to client ----

export async function assignProgram(programId: string, enrollmentId: string, clientId: string, assigneeName: string, assigneeEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get all phases + assignments for this program
  const { data: phases } = await supabase
    .from('program_phases')
    .select('id')
    .eq('program_id', programId)
    .order('order_index')

  if (!phases || phases.length === 0) return { error: 'No phases found' }

  const phaseIds = phases.map(p => p.id)

  const { data: assignments } = await supabase
    .from('program_assignments')
    .select('*')
    .in('phase_id', phaseIds)
    .order('order_index')

  if (!assignments || assignments.length === 0) return { error: 'No assignments found' }

  // Bulk create assigned_assignments
  const inserts = assignments.map(a => ({
    coach_id: user.id,
    assignment_id: a.id,
    enrollment_id: enrollmentId,
    client_id: clientId,
    assignee_name: assigneeName,
    assignee_email: assigneeEmail,
    title: a.title,
    description: a.description,
    status: 'pending' as const,
  }))

  const { error } = await supabase.from('assigned_assignments').insert(inserts)
  if (error) return { error: error.message }

  // Set current phase to first phase
  await supabase.from('enrollments').update({ current_phase_id: phases[0].id }).eq('id', enrollmentId)

  revalidatePath(`/programs/${programId}`)
  return { success: true }
}

export async function updateAssignedStatus(assignedId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates: Record<string, unknown> = { status }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await supabase.from('assigned_assignments').update(updates).eq('id', assignedId).eq('coach_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/programs')
  return { success: true }
}

export async function markAssignmentComplete(assignedId: string) {
  return updateAssignedStatus(assignedId, 'completed')
}

export async function sendAssignmentEmail(assignedId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: assigned } = await supabase
    .from('assigned_assignments')
    .select('*')
    .eq('id', assignedId)
    .eq('coach_id', user.id)
    .single()

  if (!assigned) return { error: 'Assignment not found' }
  if (!assigned.assignee_email) return { error: 'No email address' }

  const { data: coach } = await supabase.from('coaches').select('full_name').eq('id', user.id).single()

  try {
    const { sendAssignmentNotification } = await import('@/lib/email/send')
    await sendAssignmentNotification(
      assigned.assignee_email,
      coach?.full_name || 'Your Coach',
      assigned.assignee_name || 'there',
      assigned.title,
      assigned.description || ''
    )

    await supabase.from('assigned_assignments').update({
      email_sent_at: new Date().toISOString(),
      status: 'sent',
    }).eq('id', assignedId)

    revalidatePath('/programs')
    return { success: true }
  } catch {
    return { error: 'Failed to send email' }
  }
}
