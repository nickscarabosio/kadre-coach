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
