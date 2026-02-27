import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the effective coach ID for the current user.
 * If the user is a team member (has parent_coach_id), returns the parent's ID.
 * Otherwise returns the user's own ID.
 */
export async function getCoachId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: coach } = await supabase
    .from('coaches')
    .select('parent_coach_id')
    .eq('id', user.id)
    .single()

  return coach?.parent_coach_id || user.id
}
