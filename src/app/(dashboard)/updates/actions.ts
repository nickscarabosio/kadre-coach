'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteUpdate(updateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('telegram_updates')
    .delete()
    .eq('id', updateId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/updates')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateUpdateContent(updateId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('telegram_updates')
    .update({ content })
    .eq('id', updateId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/updates')
  revalidatePath('/dashboard')
  return { success: true }
}
