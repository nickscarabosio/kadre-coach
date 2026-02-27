'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

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
