'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('coaches').update({
    full_name: formData.get('full_name') as string,
    timezone: formData.get('timezone') as string,
    phone: formData.get('phone') as string || null,
  }).eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateNotificationPreferences(preferences: Record<string, boolean>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('coaches').update({
    notification_preferences: preferences as unknown as Json,
  }).eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function generateTelegramCode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Store the code temporarily — in production you'd use a cache/redis
  // For now we store it in the coach's notification_preferences
  const { data: coach } = await supabase
    .from('coaches')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  const prefs = (coach?.notification_preferences as Record<string, unknown>) || {}
  prefs._telegram_link_code = code
  prefs._telegram_link_code_expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabase.from('coaches').update({
    notification_preferences: prefs as unknown as Json,
  }).eq('id', user.id)

  return { code }
}
