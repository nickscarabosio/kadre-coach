'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

export type UpdateClassification = 'communication' | 'insight' | 'admin' | 'progress' | 'blocker'

export async function logUpdate(params: {
  client_id: string
  content: string
  classification: UpdateClassification
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('telegram_updates').insert({
    coach_id: user.id,
    client_id: params.client_id,
    content: params.content,
    classification: params.classification,
    message_type: 'text',
    chat_id: 0,
  })
  if (error) return { error: error.message }
  revalidatePath('/updates')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteUpdate(updateId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('telegram_updates')
    .delete()
    .eq('id', updateId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath('/updates')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateUpdateContent(updateId: string, content: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('telegram_updates')
    .update({ content })
    .eq('id', updateId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath('/updates')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateUpdateMetadata(updateId: string, metadata: any) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { data: currentUpdate } = await supabase.from('telegram_updates')
    .select('action_items')
    .eq('id', updateId)
    .single()

  const currentMetadata = (currentUpdate?.action_items as any) || {}
  const newMetadata = { ...currentMetadata, ...metadata }

  const { error } = await supabase.from('telegram_updates')
    .update({ action_items: newMetadata })
    .eq('id', updateId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath('/updates')
  revalidatePath('/dashboard')
  return { success: true }
}
