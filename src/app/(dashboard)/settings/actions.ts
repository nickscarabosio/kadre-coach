'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const avatarUrl = formData.get('avatar_url') as string
  const { error } = await supabase.from('coaches').update({
    full_name: formData.get('full_name') as string,
    timezone: formData.get('timezone') as string,
    phone: (formData.get('phone') as string) || null,
    bio: (formData.get('bio') as string) || null,
    booking_link: (formData.get('booking_link') as string) || null,
    avatar_url: avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : null,
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

export async function createSnippet(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()
  if (!title || !body) return { error: 'Title and body are required' }

  const { data: max } = await supabase
    .from('coach_message_snippets')
    .select('sort_order')
    .eq('coach_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('coach_message_snippets').insert({
    coach_id: user.id,
    title,
    body,
    sort_order: (max?.sort_order ?? -1) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function updateSnippet(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()
  if (!title || !body) return { error: 'Title and body are required' }

  const { error } = await supabase
    .from('coach_message_snippets')
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function deleteSnippet(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('coach_message_snippets')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
