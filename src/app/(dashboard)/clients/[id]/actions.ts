'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(clientId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('messages').insert({
    coach_id: user.id,
    client_id: clientId,
    content,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function createCoachCheckIn(
  clientId: string,
  data: {
    check_in_type: string
    title: string | null
    notes: string | null
    duration_minutes: number | null
    check_in_date: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('coach_check_ins').insert({
    coach_id: user.id,
    client_id: clientId,
    check_in_type: data.check_in_type,
    title: data.title,
    notes: data.notes,
    duration_minutes: data.duration_minutes,
    check_in_date: data.check_in_date,
  })

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function createSessionNote(
  clientId: string,
  data: {
    title: string
    content: string
    session_date: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('session_notes').insert({
    coach_id: user.id,
    client_id: clientId,
    title: data.title,
    content: data.content,
    session_date: data.session_date,
  })

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
