'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

export async function createMilestone(projectId: string, clientId: string, data: {
  title: string
  due_date?: string | null
}) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  const { data: last } = await supabase
    .from('project_milestones')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const { data: milestone, error } = await supabase.from('project_milestones').insert({
    project_id: projectId,
    coach_id: coachId,
    title: data.title,
    due_date: data.due_date || null,
    sort_order: (last?.[0]?.sort_order ?? -1) + 1,
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { milestone }
}

export async function updateMilestone(milestoneId: string, clientId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('project_milestones')
    .update(data)
    .eq('id', milestoneId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function deleteMilestone(milestoneId: string, clientId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('project_milestones')
    .delete()
    .eq('id', milestoneId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function toggleMilestoneStatus(milestoneId: string, clientId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  const { data: milestone } = await supabase.from('project_milestones')
    .select('status')
    .eq('id', milestoneId)
    .eq('coach_id', coachId)
    .single()

  if (!milestone) return { error: 'Milestone not found' }

  const newStatus = milestone.status === 'completed' ? 'pending' : 'completed'
  const { error } = await supabase.from('project_milestones')
    .update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true, status: newStatus }
}
