'use server'

import { createClient } from '@/lib/supabase/server'

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

  return { success: true }
}
