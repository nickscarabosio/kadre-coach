'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDailySynthesis } from '@/lib/email/send'

export async function sendSynthesisByEmail(synthesisId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: synthesis } = await supabase
    .from('daily_syntheses')
    .select('id, content, synthesis_date, coach_id')
    .eq('id', synthesisId)
    .eq('coach_id', user.id)
    .single()

  if (!synthesis) return { error: 'Synthesis not found' }

  const { data: coach } = await supabase
    .from('coaches')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  if (!coach?.email) return { error: 'Coach email not found' }

  try {
    const dateFormatted = new Date(synthesis.synthesis_date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    await sendDailySynthesis(
      coach.email,
      coach.full_name,
      synthesis.content,
      dateFormatted
    )
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send email' }
  }

  await supabase
    .from('daily_syntheses')
    .update({ sent_email: true })
    .eq('id', synthesisId)
    .eq('coach_id', user.id)

  revalidatePath('/syntheses')
  return { success: true }
}
