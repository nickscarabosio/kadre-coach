'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

export async function createProject(clientId: string, data: {
  title: string
  description?: string | null
  status?: string
}) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { data: lastProject } = await supabase
    .from('client_projects')
    .select('sort_order')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const { error } = await supabase.from('client_projects').insert({
    client_id: clientId,
    coach_id: coachId,
    title: data.title,
    description: data.description || null,
    status: data.status || 'active',
    sort_order: (lastProject?.[0]?.sort_order ?? -1) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function updateProject(projectId: string, clientId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('client_projects')
    .update(data)
    .eq('id', projectId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function deleteProject(projectId: string, clientId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('client_projects')
    .delete()
    .eq('id', projectId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
