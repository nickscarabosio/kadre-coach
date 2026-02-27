'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const password = formData.get('password') as string

  if (!email || !fullName || !password) return { error: 'All fields are required' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }

  const admin = createAdminClient()

  // Create the auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create user' }

  // Update the auto-created coaches row to set parent_coach_id
  const { error: updateError } = await admin
    .from('coaches')
    .update({ parent_coach_id: coachId })
    .eq('id', authData.user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function removeTeamMember(memberId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Only the owner (non-team-member) can remove members
  const { data: self } = await supabase
    .from('coaches')
    .select('parent_coach_id')
    .eq('id', user.id)
    .single()

  if (self?.parent_coach_id) return { error: 'Only the account owner can remove team members' }

  // Verify the member belongs to this coach
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('coaches')
    .select('id, parent_coach_id')
    .eq('id', memberId)
    .eq('parent_coach_id', coachId)
    .single()

  if (!member) return { error: 'Team member not found' }

  // Remove parent_coach_id (makes them an independent account)
  await admin
    .from('coaches')
    .update({ parent_coach_id: null })
    .eq('id', memberId)

  // Optionally delete the auth user entirely
  await admin.auth.admin.deleteUser(memberId)

  revalidatePath('/settings')
  return { success: true }
}

export async function getTeamMembers() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated', data: null }

  const admin = createAdminClient()
  const { data: members, error } = await admin
    .from('coaches')
    .select('id, email, full_name, created_at, telegram_chat_id, telegram_username')
    .eq('parent_coach_id', coachId)
    .order('created_at')

  if (error) return { error: error.message, data: null }
  return { data: members }
}
